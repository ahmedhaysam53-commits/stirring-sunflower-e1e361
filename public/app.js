const API = {
  token: null,
  async request(path, options = {}) {
    const headers = options.headers || {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'حدث خطأ');
    }
    if (response.status === 204) return null;
    return response.json();
  },
};

const toast = (message) => {
  const toastEl = document.getElementById('toast');
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2400);
};

const authPanel = document.getElementById('auth-panel');
const appLayout = document.getElementById('app-layout');
const logoutBtn = document.getElementById('logout');
const screenTitle = document.getElementById('screen-title');
const screenBody = document.getElementById('screen-body');
const menu = document.getElementById('menu');

const setScreen = (title, html) => {
  screenTitle.textContent = title;
  screenBody.innerHTML = html;
};

const showApp = () => {
  authPanel.hidden = true;
  appLayout.hidden = false;
  logoutBtn.hidden = false;
};

const showAuth = () => {
  authPanel.hidden = false;
  appLayout.hidden = true;
  logoutBtn.hidden = true;
};

const renderAccounts = async () => {
  const accounts = await API.request('/api/accounts');
  setScreen(
    'دليل الحسابات',
    `
    <div class="grid">
      <form id="account-form" class="grid">
        <div class="form-row">
          <input name="code" placeholder="الكود" required />
          <input name="name" placeholder="اسم الحساب" required />
          <select name="type" required>
            <option value="asset">أصل</option>
            <option value="liability">التزام</option>
            <option value="equity">حقوق ملكية</option>
            <option value="revenue">إيراد</option>
            <option value="expense">مصروف</option>
          </select>
          <input name="parent_id" placeholder="معرّف الأب (اختياري)" />
        </div>
        <button type="submit">إضافة حساب</button>
      </form>
      <table class="table">
        <thead>
          <tr>
            <th>الكود</th>
            <th>الاسم</th>
            <th>النوع</th>
            <th>الأب</th>
          </tr>
        </thead>
        <tbody>
          ${accounts
            .map(
              (acc) => `
            <tr>
              <td>${acc.code}</td>
              <td>${acc.name}</td>
              <td>${acc.type}</td>
              <td>${acc.parent_id || '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    `
  );

  document.getElementById('account-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const payload = Object.fromEntries(new FormData(form));
    await API.request('/api/accounts', { method: 'POST', body: JSON.stringify(payload) });
    toast('تمت إضافة الحساب');
    renderAccounts();
  });
};

const renderJournals = async () => {
  const entries = await API.request('/api/journals');
  const accounts = await API.request('/api/accounts');
  setScreen(
    'القيود اليومية',
    `
    <div class="grid">
      <form id="journal-form" class="grid">
        <div class="form-row">
          <input name="entry_date" type="date" required />
          <input name="description" placeholder="وصف القيد" />
        </div>
        <div class="form-row">
          <select name="account_id" required>
            ${accounts
              .map((acc) => `<option value="${acc.id}">${acc.code} - ${acc.name}</option>`)
              .join('')}
          </select>
          <input name="debit" type="number" step="0.01" placeholder="مدين" />
          <input name="credit" type="number" step="0.01" placeholder="دائن" />
          <input name="memo" placeholder="ملاحظة" />
        </div>
        <button type="submit">تسجيل قيد بسيط</button>
      </form>
      <table class="table">
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>الوصف</th>
          </tr>
        </thead>
        <tbody>
          ${entries
            .map(
              (entry) => `
            <tr>
              <td>${entry.entry_date}</td>
              <td>${entry.description || '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    `
  );

  document.getElementById('journal-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {
      entry_date: formData.get('entry_date'),
      description: formData.get('description'),
      lines: [
        {
          account_id: formData.get('account_id'),
          debit: Number(formData.get('debit') || 0),
          credit: Number(formData.get('credit') || 0),
          memo: formData.get('memo'),
        },
      ],
    };
    await API.request('/api/journals', { method: 'POST', body: JSON.stringify(payload) });
    toast('تم تسجيل القيد');
    renderJournals();
  });
};

const renderSimpleList = async (title, endpoint, formFields) => {
  const items = await API.request(endpoint);
  setScreen(
    title,
    `
    <div class="grid">
      <form id="simple-form" class="grid">
        <div class="form-row">
          ${formFields
            .map(
              (field) =>
                `<input name="${field.name}" placeholder="${field.label}" ${field.required ? 'required' : ''} />`
            )
            .join('')}
        </div>
        <button type="submit">إضافة</button>
      </form>
      <table class="table">
        <thead>
          <tr>
            ${formFields.map((field) => `<th>${field.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr>
              ${formFields.map((field) => `<td>${item[field.name] || '-'}</td>`).join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    `
  );

  document.getElementById('simple-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target));
    await API.request(endpoint, { method: 'POST', body: JSON.stringify(payload) });
    toast('تمت الإضافة');
    renderSimpleList(title, endpoint, formFields);
  });
};

const renderReports = async () => {
  const trial = await API.request('/api/reports/trial-balance');
  const income = await API.request('/api/reports/income-statement');
  const balance = await API.request('/api/reports/balance-sheet');
  setScreen(
    'التقارير',
    `
    <div class="grid">
      <div>
        <h4>ميزان المراجعة</h4>
        <table class="table">
          <thead>
            <tr><th>الكود</th><th>الاسم</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr>
          </thead>
          <tbody>
            ${trial
              .map(
                (row) => `
              <tr>
                <td>${row.code}</td>
                <td>${row.name}</td>
                <td>${Number(row.total_debit || 0).toFixed(2)}</td>
                <td>${Number(row.total_credit || 0).toFixed(2)}</td>
                <td>${Number(row.balance || 0).toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <div class="form-row">
        <div class="auth-card">
          <h4>قائمة الدخل</h4>
          <p>الإيرادات: ${Number(income.revenue || 0).toFixed(2)}</p>
          <p>المصروفات: ${Number(income.expense || 0).toFixed(2)}</p>
        </div>
        <div class="auth-card">
          <h4>المركز المالي</h4>
          <p>الأصول: ${Number(balance.assets || 0).toFixed(2)}</p>
          <p>الالتزامات: ${Number(balance.liabilities || 0).toFixed(2)}</p>
          <p>حقوق الملكية: ${Number(balance.equity || 0).toFixed(2)}</p>
        </div>
      </div>
    </div>
    `
  );
};

const screenHandlers = {
  accounts: renderAccounts,
  journals: renderJournals,
  customers: () =>
    renderSimpleList('العملاء', '/api/customers', [
      { name: 'name', label: 'الاسم', required: true },
      { name: 'phone', label: 'الهاتف' },
      { name: 'email', label: 'البريد' },
    ]),
  suppliers: () =>
    renderSimpleList('الموردين', '/api/suppliers', [
      { name: 'name', label: 'الاسم', required: true },
      { name: 'phone', label: 'الهاتف' },
      { name: 'email', label: 'البريد' },
    ]),
  receipts: () =>
    renderSimpleList('سندات قبض', '/api/receipts', [
      { name: 'receipt_date', label: 'التاريخ', required: true },
      { name: 'customer_id', label: 'رقم العميل' },
      { name: 'amount', label: 'المبلغ', required: true },
      { name: 'description', label: 'الوصف' },
    ]),
  payments: () =>
    renderSimpleList('سندات صرف', '/api/payments', [
      { name: 'payment_date', label: 'التاريخ', required: true },
      { name: 'supplier_id', label: 'رقم المورد' },
      { name: 'amount', label: 'المبلغ', required: true },
      { name: 'description', label: 'الوصف' },
    ]),
  reports: renderReports,
};

menu.addEventListener('click', async (event) => {
  const button = event.target.closest('.menu-item');
  if (!button) return;
  const screen = button.dataset.screen;
  document.querySelectorAll('.menu-item').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  if (screenHandlers[screen]) {
    await screenHandlers[screen]();
  }
});

logoutBtn.addEventListener('click', () => {
  API.token = null;
  localStorage.removeItem('token');
  showAuth();
});

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target));
  const data = await API.request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  API.token = data.token;
  localStorage.setItem('token', data.token);
  showApp();
  toast('تم تسجيل الدخول');
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target));
  await API.request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  toast('تم إنشاء الحساب. يمكنك تسجيل الدخول الآن.');
});

const savedToken = localStorage.getItem('token');
if (savedToken) {
  API.token = savedToken;
  showApp();
} else {
  showAuth();
}
