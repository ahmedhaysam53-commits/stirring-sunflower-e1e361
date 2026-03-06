const buttonLabels = {
  1: 'زر 1 الرئيسي',
  2: 'المالية',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: '11',
};

Object.entries(buttonLabels).forEach(([key, label]) => {
  const button = document.querySelector(`[data-key="${key}"]`);
  if (button) {
    button.textContent = label;
  }
});

const mainButton = document.getElementById('btn-1');
const dropdown = document.getElementById('dropdown');
const financeButton = document.getElementById('btn-2');
const financeMenu = document.getElementById('finance-menu');
const financeTreeButton = document.getElementById('finance-tree-btn');
const financeTreeSection = document.getElementById('finance-tree');
const closeTreeButton = document.getElementById('close-tree');

const accountData = {
  assets: [
    { id: 1, code: '11', name: 'الأصول المتداولة', type: 'متداول' },
    { id: 2, code: '111', name: 'النقدية بالصندوق (عهدة، نقدية محلية)', type: 'متداول' },
    { id: 3, code: '112', name: 'البنوك (حسابات جارية)', type: 'متداول' },
    { id: 4, code: '113', name: 'ذمم مدينة (عملاء)', type: 'متداول' },
    { id: 5, code: '114', name: 'أرصدة مدينة أخرى', type: 'متداول' },
    { id: 6, code: '115', name: 'المخزون', type: 'متداول' },
    { id: 7, code: '12', name: 'الأصول غير المتداولة (الثابتة)', type: 'ثابت' },
    { id: 8, code: '121', name: 'الأراضي', type: 'ثابت' },
    { id: 9, code: '122', name: 'المباني والمنشآت', type: 'ثابت' },
    { id: 10, code: '123', name: 'الآلات والمعدات', type: 'ثابت' },
    { id: 11, code: '124', name: 'سيارات ووسائل نقل', type: 'ثابت' },
    { id: 12, code: '125', name: 'أثاث ومعدات مكاتب', type: 'ثابت' },
    { id: 13, code: '126', name: 'أجهزة حاسب آلي وبرامج', type: 'ثابت' },
    { id: 14, code: '13', name: 'مجمعات الإهلاك (حسابات دائنة للأصول)', type: 'مجمع إهلاك' },
    { id: 15, code: '131', name: 'مجمع إهلاك مباني', type: 'مجمع إهلاك' },
    { id: 16, code: '132', name: 'مجمع إهلاك سيارات', type: 'مجمع إهلاك' },
    { id: 17, code: '133', name: 'مجمع إهلاك أجهزة ومعدات', type: 'مجمع إهلاك' },
  ],
  liabilities: [
    { id: 1, code: '21', name: 'الالتزامات المتداولة', type: 'متداول' },
    { id: 2, code: '211', name: 'الموردون (ذمم دائنة)', type: 'متداول' },
    { id: 3, code: '212', name: 'مصروفات مستحقة (رواتب مستحقة، إيجار مستحق)', type: 'متداول' },
    { id: 4, code: '213', name: 'مصلحة الضرائب (ضريبة القيمة المضافة)', type: 'متداول' },
    { id: 5, code: '214', name: 'أرصدة دائنة أخرى', type: 'متداول' },
  ],
  equity: [
    { id: 1, code: '31', name: 'رأس المال', type: 'حقوق ملكية' },
    { id: 2, code: '32', name: 'جاري الشركاء', type: 'حقوق ملكية' },
    { id: 3, code: '33', name: 'الأرباح والخسائر المرحلة (أو الدورة)', type: 'حقوق ملكية' },
  ],
  revenues: [
    { id: 1, code: '41', name: 'مبيعات النشاط الجاري', type: 'إيراد' },
    { id: 2, code: '42', name: 'مردودات ومسموحات مبيعات (-)', type: 'إيراد' },
    { id: 3, code: '43', name: 'إيرادات متنوعة أخرى', type: 'إيراد' },
  ],
  expenses: [
    { id: 1, code: '51', name: 'مصروفات التشغيل (تكلفة النشاط)', type: 'تشغيل' },
    { id: 2, code: '511', name: 'مواد خام ومستلزمات', type: 'تشغيل' },
    { id: 3, code: '512', name: 'أجور ومرتبات تشغيلية', type: 'تشغيل' },
    { id: 4, code: '513', name: 'صيانة وتشغيل المعدات', type: 'تشغيل' },
    { id: 5, code: '52', name: 'المصروفات الإدارية والعمومية', type: 'إدارية' },
    { id: 6, code: '5201', name: 'رواتب وأجور إدارية', type: 'إدارية' },
    { id: 7, code: '5202', name: 'إيجارات', type: 'إدارية' },
    { id: 8, code: '5203', name: 'كهرباء ومياه وتليفون', type: 'إدارية' },
    { id: 9, code: '5204', name: 'أدوات كتابية وقرطاسية', type: 'إدارية' },
    { id: 10, code: '5205', name: 'ضيافة ونظافة', type: 'إدارية' },
    { id: 11, code: '5206', name: 'مصاريف بنكية', type: 'إدارية' },
    { id: 12, code: '5207', name: 'رسوم وتراخيص حكومية', type: 'إدارية' },
    { id: 13, code: '5208', name: 'اشتراكات وتبرعات', type: 'إدارية' },
    { id: 14, code: '5209', name: 'مصاريف سفر وانتقالات', type: 'إدارية' },
    { id: 15, code: '5210', name: 'بريد وتوصيل', type: 'إدارية' },
    { id: 16, code: '53', name: 'مصروفات البيع والتسويق', type: 'تسويق' },
    { id: 17, code: '531', name: 'دعاية وإعلان', type: 'تسويق' },
    { id: 18, code: '532', name: 'عمولات مبيعات', type: 'تسويق' },
    { id: 19, code: '533', name: 'شحن وتوصيل للعملاء', type: 'تسويق' },
    { id: 20, code: '54', name: 'الإهلاكات', type: 'إهلاك' },
    { id: 21, code: '541', name: 'مصروف إهلاك الفترة', type: 'إهلاك' },
  ],
};

const selectedRows = {};
const modal = document.getElementById('account-modal');
const modalTitle = document.getElementById('modal-title');
const modalSave = document.getElementById('modal-save');
const modalCancel = document.getElementById('modal-cancel');
const modalCode = document.getElementById('account-code');
const modalName = document.getElementById('account-name');
const modalType = document.getElementById('account-type');
let modalContext = null;

const renderTable = (key) => {
  const tbody = document.querySelector(`[data-table="${key}"]`);
  if (!tbody) {
    return;
  }
  tbody.innerHTML = accountData[key]
    .map(
      (row) => `
        <tr data-id="${row.id}">
          <td>${row.code}</td>
          <td>${row.name}</td>
          <td>${row.type}</td>
        </tr>
      `,
    )
    .join('');
};

Object.keys(accountData).forEach((key) => renderTable(key));

const clearSelection = (key) => {
  const tbody = document.querySelector(`[data-table="${key}"]`);
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((row) => row.classList.remove('selected'));
  selectedRows[key] = null;
};

document.querySelectorAll('tbody[data-table]').forEach((tbody) => {
  const key = tbody.getAttribute('data-table');
  tbody.addEventListener('click', (event) => {
    const row = event.target.closest('tr');
    if (!row) return;
    clearSelection(key);
    row.classList.add('selected');
    selectedRows[key] = Number(row.getAttribute('data-id'));
  });
});

const openModal = (mode, key, row) => {
  modalContext = { mode, key, rowId: row?.id ?? null };
  modalTitle.textContent = mode === 'add' ? 'إضافة حساب' : 'تعديل حساب';
  modalCode.value = row?.code ?? '';
  modalName.value = row?.name ?? '';
  modalType.value = row?.type ?? '';
  modal.hidden = false;
};

const closeModal = () => {
  modal.hidden = true;
  modalContext = null;
};

modalCancel?.addEventListener('click', closeModal);

modalSave?.addEventListener('click', () => {
  if (!modalContext) return;
  const { mode, key, rowId } = modalContext;
  const code = modalCode.value.trim();
  const name = modalName.value.trim();
  const type = modalType.value.trim();
  if (!code || !name || !type) {
    alert('يرجى إدخال كل الحقول');
    return;
  }

  if (mode === 'add') {
    const nextId = Math.max(0, ...accountData[key].map((r) => r.id)) + 1;
    accountData[key].push({ id: nextId, code, name, type });
  } else if (mode === 'edit' && rowId) {
    const row = accountData[key].find((r) => r.id === rowId);
    if (row) {
      row.code = code;
      row.name = name;
      row.type = type;
    }
  }

  renderTable(key);
  closeModal();
});

if (mainButton && dropdown) {
  mainButton.addEventListener('click', () => {
    dropdown.hidden = !dropdown.hidden;
    if (dropdown.hidden && financeMenu) {
      financeMenu.hidden = true;
    }
  });

  if (financeButton && financeMenu) {
    financeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      financeMenu.hidden = !financeMenu.hidden;
      if (financeTreeSection) {
        financeTreeSection.hidden = false;
        openWindow('assetsWin');
      }
    });
  }

  if (financeTreeButton && financeTreeSection) {
    financeTreeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      financeTreeSection.hidden = false;
      openWindow('assetsWin');
    });
  }

  if (closeTreeButton && financeTreeSection) {
    closeTreeButton.addEventListener('click', () => {
      financeTreeSection.hidden = true;
    });
  }

  document.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target) && event.target !== mainButton) {
      dropdown.hidden = true;
      if (financeMenu) {
        financeMenu.hidden = true;
      }
    }
  });
}

const accountIcons = document.querySelectorAll('.account-icon');

const resetWindowSize = (windowElement) => {
  windowElement.classList.remove('is-maximized');
};

const openWindow = (windowId) => {
  const windowElement = document.getElementById(windowId);
  if (!windowElement) {
    return;
  }
  windowElement.hidden = false;
  resetWindowSize(windowElement);
};

accountIcons.forEach((icon) => {
  icon.addEventListener('click', () => {
    const windowId = icon.getAttribute('data-win');
    if (windowId) {
      openWindow(windowId);
    }
  });
});

document.querySelectorAll('.erp-window').forEach((windowElement) => {
  windowElement.addEventListener('click', (event) => {
    const actionButton = event.target.closest('button[data-action]');
    if (!actionButton) {
      return;
    }

    const windowId = windowElement.id;
    const keyMap = {
      assetsWin: 'assets',
      liabilitiesWin: 'liabilities',
      equityWin: 'equity',
      revenueWin: 'revenues',
      expensesWin: 'expenses',
    };
    const key = keyMap[windowId];

    const action = actionButton.getAttribute('data-action');
    if (action === 'close' || action === 'minimize') {
      windowElement.hidden = true;
      return;
    }

    if (action === 'maximize') {
      windowElement.classList.toggle('is-maximized');
      return;
    }

    if (action === 'add' && key) {
      openModal('add', key);
      return;
    }

    if (action === 'edit' && key) {
      const rowId = selectedRows[key];
      const row = accountData[key].find((r) => r.id === rowId);
      if (!row) {
        alert('يرجى اختيار حساب للتعديل');
        return;
      }
      openModal('edit', key, row);
      return;
    }

    if (action === 'delete' && key) {
      const rowId = selectedRows[key];
      if (!rowId) {
        alert('يرجى اختيار حساب للحذف');
        return;
      }
      const confirmDelete = confirm('هل تريد حذف الحساب؟');
      if (!confirmDelete) return;
      accountData[key] = accountData[key].filter((r) => r.id !== rowId);
      renderTable(key);
      clearSelection(key);
    }
  });
});
