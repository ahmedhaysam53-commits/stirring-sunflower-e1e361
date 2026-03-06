import os
import sqlite3
import tkinter as tk
from dataclasses import dataclass
from tkinter import messagebox, ttk

DB_NAME = "journal.db"


@dataclass
class Account:
    id: int
    name: str
    code: str
    parent_id: int | None


class ChartOfAccountsFrame(tk.Frame):
    def __init__(self, parent: tk.Widget) -> None:
        super().__init__(parent, bg="white")
        self.db_path = os.path.join(os.path.dirname(__file__), DB_NAME)
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        self.selected_account: int | None = None

        self._ensure_schema()
        self._seed_accounts_if_empty()

        tk.Label(
            self,
            text="شجرة الحسابات",
            font=("Segoe UI", 18, "bold"),
            bg="white",
        ).pack(pady=10)

        self.tree = ttk.Treeview(self, columns=("code",), show="tree headings")
        self.tree.heading("#0", text="اسم الحساب")
        self.tree.heading("code", text="الكود")
        self.tree.pack(fill="both", expand=True, padx=20, pady=10)
        self.tree.bind("<<TreeviewSelect>>", self.on_select)

        btn_frame = tk.Frame(self, bg="white")
        btn_frame.pack(pady=10)
        tk.Button(
            btn_frame,
            text="إضافة حساب",
            command=self.add_account,
            width=15,
            bg="#27ae60",
            fg="white",
        ).pack(side="right", padx=5)
        tk.Button(
            btn_frame,
            text="تعديل",
            command=self.edit_account,
            width=15,
            bg="#f39c12",
            fg="white",
        ).pack(side="right", padx=5)
        tk.Button(
            btn_frame,
            text="حذف",
            command=self.delete_account,
            width=15,
            bg="#e74c3c",
            fg="white",
        ).pack(side="right", padx=5)

        self.load_accounts()

    def _ensure_schema(self) -> None:
        self.cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT,
                parent_id INTEGER,
                FOREIGN KEY(parent_id) REFERENCES accounts(id)
            );
            """
        )
        self.conn.commit()

    def _seed_accounts_if_empty(self) -> None:
        count = self.cursor.execute("SELECT COUNT(*) FROM accounts").fetchone()[0]
        if count:
            return

        data = [
            ("الأصول (Assets)", "1", None),
            ("الأصول المتداولة", "11", 1),
            ("النقدية بالصندوق (عهدة، نقدية محلية)", "111", 2),
            ("البنوك (حسابات جارية)", "112", 2),
            ("ذمم مدينة (عملاء)", "113", 2),
            ("أرصدة مدينة أخرى", "114", 2),
            ("المخزون", "115", 2),
            ("الأصول غير المتداولة (الثابتة)", "12", 1),
            ("الأراضي", "121", 8),
            ("المباني والمنشآت", "122", 8),
            ("الآلات والمعدات", "123", 8),
            ("سيارات ووسائل نقل", "124", 8),
            ("أثاث ومعدات مكاتب", "125", 8),
            ("أجهزة حاسب آلي وبرامج", "126", 8),
            ("مجمعات الإهلاك (حسابات دائنة للأصول)", "13", 1),
            ("مجمع إهلاك مباني", "131", 14),
            ("مجمع إهلاك سيارات", "132", 14),
            ("مجمع إهلاك أجهزة ومعدات", "133", 14),
            ("الالتزامات (Liabilities)", "2", None),
            ("الالتزامات المتداولة", "21", 18),
            ("الموردون (ذمم دائنة)", "211", 19),
            ("مصروفات مستحقة (رواتب مستحقة، إيجار مستحق)", "212", 19),
            ("مصلحة الضرائب (ضريبة القيمة المضافة)", "213", 19),
            ("أرصدة دائنة أخرى", "214", 19),
            ("حقوق الملكية (Equity)", "3", None),
            ("رأس المال", "31", 24),
            ("جاري الشركاء", "32", 24),
            ("الأرباح والخسائر المرحلة (أو الدورة)", "33", 24),
            ("الإيرادات (Revenues)", "4", None),
            ("مبيعات النشاط الجاري", "41", 28),
            ("مردودات ومسموحات مبيعات (-)", "42", 28),
            ("إيرادات متنوعة أخرى", "43", 28),
            ("المصروفات (Expenses)", "5", None),
            ("مصروفات التشغيل (تكلفة النشاط)", "51", 32),
            ("مواد خام ومستلزمات", "511", 33),
            ("أجور ومرتبات تشغيلية", "512", 33),
            ("صيانة وتشغيل المعدات", "513", 33),
            ("المصروفات الإدارية والعمومية", "52", 32),
            ("رواتب وأجور إدارية", "5201", 37),
            ("إيجارات", "5202", 37),
            ("كهرباء ومياه وتليفون", "5203", 37),
            ("أدوات كتابية وقرطاسية", "5204", 37),
            ("ضيافة ونظافة", "5205", 37),
            ("مصاريف بنكية", "5206", 37),
            ("رسوم وتراخيص حكومية", "5207", 37),
            ("اشتراكات وتبرعات", "5208", 37),
            ("مصاريف سفر وانتقالات", "5209", 37),
            ("بريد وتوصيل", "5210", 37),
            ("مصروفات البيع والتسويق", "53", 32),
            ("دعاية وإعلان", "531", 48),
            ("عمولات مبيعات", "532", 48),
            ("شحن وتوصيل للعملاء", "533", 48),
            ("الإهلاكات", "54", 32),
            ("مصروف إهلاك الفترة", "541", 52),
        ]

        self.cursor.executemany(
            "INSERT INTO accounts (name, code, parent_id) VALUES (?, ?, ?)", data
        )
        self.conn.commit()

    def load_accounts(self) -> None:
        for item in self.tree.get_children():
            self.tree.delete(item)

        rows = self.cursor.execute(
            "SELECT id, name, code, parent_id FROM accounts ORDER BY code"
        ).fetchall()
        accounts = [Account(*row) for row in rows]

        children_map: dict[int | None, list[Account]] = {}
        for account in accounts:
            children_map.setdefault(account.parent_id, []).append(account)

        def insert_nodes(parent_id: int | None, parent_tree_id: str = "") -> None:
            for account in children_map.get(parent_id, []):
                tree_id = self.tree.insert(
                    parent_tree_id,
                    "end",
                    iid=str(account.id),
                    text=account.name,
                    values=(account.code or "",),
                )
                insert_nodes(account.id, tree_id)

        if accounts:
            insert_nodes(None)
        else:
            self.tree.insert("", "end", text="لا توجد حسابات", values=("",))

    def on_select(self, _event: tk.Event) -> None:
        selection = self.tree.selection()
        if selection:
            self.selected_account = int(selection[0])

    def add_account(self) -> None:
        dialog = tk.Toplevel(self)
        dialog.title("إضافة حساب")
        dialog.geometry("380x240")
        dialog.configure(bg="white")

        tk.Label(dialog, text="اسم الحساب", bg="white").pack(pady=10)
        name_entry = tk.Entry(dialog, font=("Arial", 12))
        name_entry.pack(fill="x", padx=20)

        tk.Label(dialog, text="الكود", bg="white").pack(pady=10)
        code_entry = tk.Entry(dialog, font=("Arial", 12))
        code_entry.pack(fill="x", padx=20)

        parent_var = tk.IntVar(value=0)
        parent_label = "إضافة تحت الحساب المحدد" if self.selected_account else "إضافة كحساب رئيسي"
        parent_checkbox = tk.Checkbutton(
            dialog,
            text=parent_label,
            variable=parent_var,
            onvalue=1,
            offvalue=0,
            bg="white",
        )
        if self.selected_account:
            parent_var.set(1)
        parent_checkbox.pack(pady=10)

        def save() -> None:
            name = name_entry.get().strip()
            code = code_entry.get().strip()
            if not name:
                messagebox.showwarning("تنبيه", "اكتب اسم الحساب")
                return
            parent_id = self.selected_account if parent_var.get() == 1 else None
            self.cursor.execute(
                "INSERT INTO accounts (name, code, parent_id) VALUES (?, ?, ?)",
                (name, code, parent_id),
            )
            self.conn.commit()
            dialog.destroy()
            self.load_accounts()

        tk.Button(dialog, text="حفظ", command=save, bg="#27ae60", fg="white").pack(pady=20)

    def edit_account(self) -> None:
        if not self.selected_account:
            return
        account = self.cursor.execute(
            "SELECT id, name, code FROM accounts WHERE id=?",
            (self.selected_account,),
        ).fetchone()
        dialog = tk.Toplevel(self)
        dialog.title("تعديل")
        dialog.geometry("380x220")
        dialog.configure(bg="white")

        name_entry = tk.Entry(dialog, font=("Arial", 12))
        name_entry.pack(fill="x", padx=20, pady=10)
        name_entry.insert(0, account[1])

        code_entry = tk.Entry(dialog, font=("Arial", 12))
        code_entry.pack(fill="x", padx=20, pady=10)
        code_entry.insert(0, account[2] or "")

        def save() -> None:
            new_name = name_entry.get().strip()
            new_code = code_entry.get().strip()
            self.cursor.execute(
                "UPDATE accounts SET name=?, code=? WHERE id=?",
                (new_name, new_code, account[0]),
            )
            self.conn.commit()
            dialog.destroy()
            self.load_accounts()

        tk.Button(dialog, text="حفظ", command=save, bg="#27ae60", fg="white").pack()

    def delete_account(self) -> None:
        if not self.selected_account:
            return
        if not messagebox.askyesno("تأكيد", "حذف الحساب وكل الحسابات التابعة؟"):
            return

        def delete_recursive(account_id: int) -> None:
            children = self.cursor.execute(
                "SELECT id FROM accounts WHERE parent_id=?", (account_id,)
            ).fetchall()
            for child_id, in children:
                delete_recursive(child_id)
            self.cursor.execute("DELETE FROM accounts WHERE id=?", (account_id,))

        delete_recursive(self.selected_account)
        self.conn.commit()
        self.selected_account = None
        self.load_accounts()

    def destroy(self) -> None:
        self.conn.close()
        super().destroy()


def open_chart_of_accounts_window(parent: tk.Widget) -> None:
    top = tk.Toplevel(parent)
    top.title("شجرة الحسابات")
    frame = ChartOfAccountsFrame(top)
    frame.pack(fill="both", expand=True)


def clear_all_accounts() -> None:
    conn = sqlite3.connect(os.path.join(os.path.dirname(__file__), DB_NAME))
    cursor = conn.cursor()
    cursor.execute("DELETE FROM accounts;")
    conn.commit()
    conn.close()
    print("تم تفريغ كل الحسابات من البرنامج.")


if __name__ == "__main__":
    root = tk.Tk()
    root.geometry("700x500")
    root.title("ERP")
    ChartOfAccountsFrame(root).pack(fill="both", expand=True)
    root.mainloop()
