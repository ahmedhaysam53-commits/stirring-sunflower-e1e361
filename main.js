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
const addAccountButton = document.getElementById('tree-add');
const editAccountButton = document.getElementById('tree-edit');
const deleteAccountButton = document.getElementById('tree-delete');

const treeContainer = document.getElementById('tree-container');

const STORAGE_KEY = 'chartOfAccountsTree';
let selectedAccountCode = null;

const defaultChartOfAccounts = [
  {
    code: '1',
    name: 'الأصول (Assets)',
    children: [
      {
        code: '11',
        name: 'الأصول المتداولة',
        children: [
          { code: '111', name: 'النقدية بالصندوق (عهدة، نقدية محلية)' },
          { code: '112', name: 'البنوك (حسابات جارية)' },
          { code: '113', name: 'ذمم مدينة (عملاء)' },
          { code: '114', name: 'أرصدة مدينة أخرى' },
          { code: '115', name: 'المخزون' },
        ],
      },
      {
        code: '12',
        name: 'الأصول غير المتداولة (الثابتة)',
        children: [
          { code: '121', name: 'الأراضي' },
          { code: '122', name: 'المباني والمنشآت' },
          { code: '123', name: 'الآلات والمعدات' },
          { code: '124', name: 'سيارات ووسائل نقل' },
          { code: '125', name: 'أثاث ومعدات مكاتب' },
          { code: '126', name: 'أجهزة حاسب آلي وبرامج' },
        ],
      },
      {
        code: '13',
        name: 'مجمعات الإهلاك (حسابات دائنة للأصول)',
        children: [
          { code: '131', name: 'مجمع إهلاك مباني' },
          { code: '132', name: 'مجمع إهلاك سيارات' },
          { code: '133', name: 'مجمع إهلاك أجهزة ومعدات' },
        ],
      },
    ],
  },
  {
    code: '2',
    name: 'الالتزامات (Liabilities)',
    children: [
      {
        code: '21',
        name: 'الالتزامات المتداولة',
        children: [
          { code: '211', name: 'الموردون (ذمم دائنة)' },
          { code: '212', name: 'مصروفات مستحقة (رواتب مستحقة، إيجار مستحق)' },
          { code: '213', name: 'مصلحة الضرائب (ضريبة القيمة المضافة)' },
          { code: '214', name: 'أرصدة دائنة أخرى' },
        ],
      },
    ],
  },
  {
    code: '3',
    name: 'حقوق الملكية (Equity)',
    children: [
      { code: '31', name: 'رأس المال' },
      { code: '32', name: 'جاري الشركاء' },
      { code: '33', name: 'الأرباح والخسائر المرحلة (أو الدورة)' },
    ],
  },
  {
    code: '4',
    name: 'الإيرادات (Revenues)',
    children: [
      { code: '41', name: 'مبيعات النشاط الجاري' },
      { code: '42', name: 'مردودات ومسموحات مبيعات (-)' },
      { code: '43', name: 'إيرادات متنوعة أخرى' },
    ],
  },
  {
    code: '5',
    name: 'المصروفات (Expenses)',
    children: [
      {
        code: '51',
        name: 'مصروفات التشغيل (تكلفة النشاط)',
        children: [
          { code: '511', name: 'مواد خام ومستلزمات' },
          { code: '512', name: 'أجور ومرتبات تشغيلية' },
          { code: '513', name: 'صيانة وتشغيل المعدات' },
        ],
      },
      {
        code: '52',
        name: 'المصروفات الإدارية والعمومية',
        children: [
          { code: '5201', name: 'رواتب وأجور إدارية' },
          { code: '5202', name: 'إيجارات' },
          { code: '5203', name: 'كهرباء ومياه وتليفون' },
          { code: '5204', name: 'أدوات كتابية وقرطاسية' },
          { code: '5205', name: 'ضيافة ونظافة' },
          { code: '5206', name: 'مصاريف بنكية' },
          { code: '5207', name: 'رسوم وتراخيص حكومية' },
          { code: '5208', name: 'اشتراكات وتبرعات' },
          { code: '5209', name: 'مصاريف سفر وانتقالات' },
          { code: '5210', name: 'بريد وتوصيل' },
        ],
      },
      {
        code: '53',
        name: 'مصروفات البيع والتسويق',
        children: [
          { code: '531', name: 'دعاية وإعلان' },
          { code: '532', name: 'عمولات مبيعات' },
          { code: '533', name: 'شحن وتوصيل للعملاء' },
        ],
      },
      {
        code: '54',
        name: 'الإهلاكات',
        children: [{ code: '541', name: 'مصروف إهلاك الفترة' }],
      },
    ],
  },
];

const loadTree = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultChartOfAccounts);
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    console.warn('Failed to load chart of accounts.', error);
  }
  return structuredClone(defaultChartOfAccounts);
};

const saveTree = (nodes) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
};

let chartOfAccounts = loadTree();

const renderTreeNodes = (nodes) =>
  nodes
    .map((node) => {
      const isSelected = node.code === selectedAccountCode;
      const selectedClass = isSelected ? 'tree-selected' : '';
      if (node.children && node.children.length) {
        return `
          <details class="tree-node ${selectedClass}" data-code="${node.code}">
            <summary>
              <div class="node-label">
                <span>${node.name}</span>
                <span class="node-code">${node.code}</span>
              </div>
            </summary>
            <div class="tree-children">
              ${renderTreeNodes(node.children)}
            </div>
          </details>
        `;
      }

      return `
        <div class="leaf-node ${selectedClass}" data-code="${node.code}">
          <span>${node.name}</span>
          <span class="node-code">${node.code}</span>
        </div>
      `;
    })
    .join('');

const renderTree = () => {
  if (!treeContainer) return;
  treeContainer.innerHTML = renderTreeNodes(chartOfAccounts);
};

const findNodeByCode = (nodes, code, parent = null, container = null) => {
  for (const node of nodes) {
    if (node.code === code) {
      return { node, parent, container: container ?? nodes };
    }
    if (node.children && node.children.length) {
      const found = findNodeByCode(node.children, code, node, node.children);
      if (found) return found;
    }
  }
  return null;
};

const codeExists = (nodes, code, excludeCode = null) => {
  for (const node of nodes) {
    if (node.code === code && code !== excludeCode) return true;
    if (node.children && node.children.length) {
      if (codeExists(node.children, code, excludeCode)) return true;
    }
  }
  return false;
};

renderTree();

if (mainButton && dropdown) {
  mainButton.addEventListener('click', () => {
    dropdown.hidden = !dropdown.hidden;
    if (dropdown.hidden && financeMenu) {
      financeMenu.hidden = true;
    }
  });
}

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
    });
  }

if (closeTreeButton && financeTreeSection) {
  closeTreeButton.addEventListener('click', () => {
    financeTreeSection.hidden = true;
  });
}

if (treeContainer) {
  treeContainer.addEventListener('click', (event) => {
    const target = event.target.closest('[data-code]');
    if (!target || !treeContainer.contains(target)) return;
    selectedAccountCode = target.dataset.code;
    renderTree();
  });
}

if (addAccountButton) {
  addAccountButton.addEventListener('click', () => {
    const newCode = prompt('أدخل كود الحساب الجديد:');
    if (!newCode) return;
    if (codeExists(chartOfAccounts, newCode)) {
      alert('هذا الكود موجود بالفعل. اختر كوداً مختلفاً.');
      return;
    }
    const newName = prompt('أدخل اسم الحساب الجديد:');
    if (!newName) return;

    const newAccount = { code: newCode.trim(), name: newName.trim() };
    if (selectedAccountCode) {
      const found = findNodeByCode(chartOfAccounts, selectedAccountCode);
      if (found?.node) {
        if (!found.node.children) {
          found.node.children = [];
        }
        found.node.children.push(newAccount);
      } else {
        chartOfAccounts.push(newAccount);
      }
    } else {
      chartOfAccounts.push(newAccount);
    }

    saveTree(chartOfAccounts);
    renderTree();
  });
}

if (editAccountButton) {
  editAccountButton.addEventListener('click', () => {
    if (!selectedAccountCode) {
      alert('اختر حساباً أولاً للتعديل.');
      return;
    }
    const found = findNodeByCode(chartOfAccounts, selectedAccountCode);
    if (!found?.node) return;

    const newCode = prompt('أدخل الكود الجديد:', found.node.code);
    if (!newCode) return;
    if (codeExists(chartOfAccounts, newCode.trim(), found.node.code)) {
      alert('هذا الكود موجود بالفعل. اختر كوداً مختلفاً.');
      return;
    }
    const newName = prompt('أدخل الاسم الجديد:', found.node.name);
    if (!newName) return;

    found.node.code = newCode.trim();
    found.node.name = newName.trim();
    selectedAccountCode = found.node.code;
    saveTree(chartOfAccounts);
    renderTree();
  });
}

if (deleteAccountButton) {
  deleteAccountButton.addEventListener('click', () => {
    if (!selectedAccountCode) {
      alert('اختر حساباً أولاً للحذف.');
      return;
    }
    const found = findNodeByCode(chartOfAccounts, selectedAccountCode);
    if (!found?.node || !found.container) return;

    const hasChildren = found.node.children && found.node.children.length;
    const confirmationMessage = hasChildren
      ? 'هذا الحساب يحتوي على حسابات فرعية. هل تريد الحذف؟'
      : 'هل تريد حذف هذا الحساب؟';
    if (!confirm(confirmationMessage)) return;

    const index = found.container.findIndex((item) => item.code === selectedAccountCode);
    if (index !== -1) {
      found.container.splice(index, 1);
    }
    selectedAccountCode = null;
    saveTree(chartOfAccounts);
    renderTree();
  });
}

document.addEventListener('click', (event) => {
  if (dropdown && mainButton && !dropdown.contains(event.target) && event.target !== mainButton) {
    dropdown.hidden = true;
    if (financeMenu) {
      financeMenu.hidden = true;
    }
  }
});

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

