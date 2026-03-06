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
    { id: 1, code: '111', name: 'النقدية بالصندوق', type: 'متداول' },
    { id: 2, code: '112', name: 'البنوك', type: 'متداول' },
    { id: 3, code: '121', name: 'المباني والمنشآت', type: 'ثابت' },
  ],
  liabilities: [
    { id: 1, code: '211', name: 'الموردون', type: 'متداول' },
    { id: 2, code: '212', name: 'مصروفات مستحقة', type: 'متداول' },
  ],
  equity: [
    { id: 1, code: '31', name: 'رأس المال', type: 'حقوق ملكية' },
    { id: 2, code: '33', name: 'الأرباح والخسائر المرحلة', type: 'حقوق ملكية' },
  ],
  revenues: [
    { id: 1, code: '41', name: 'مبيعات النشاط الجاري', type: 'إيراد' },
    { id: 2, code: '43', name: 'إيرادات متنوعة أخرى', type: 'إيراد' },
  ],
  expenses: [
    { id: 1, code: '5201', name: 'رواتب وأجور إدارية', type: 'مصروف' },
    { id: 2, code: '531', name: 'دعاية وإعلان', type: 'مصروف' },
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
