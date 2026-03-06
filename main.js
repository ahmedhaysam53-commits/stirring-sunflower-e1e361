const menuContainer = document.getElementById('menu-container');
const financeTreeSection = document.getElementById('finance-tree');
const closeTreeButton = document.getElementById('close-tree');
const screenTitle = document.getElementById('screen-title');
const screenDescription = document.getElementById('screen-description');
const screenBody = document.getElementById('screen-body');
const menuTitle = document.getElementById('menu-title');
const addAccountButton = document.getElementById('tree-add');
const editAccountButton = document.getElementById('tree-edit');
const deleteAccountButton = document.getElementById('tree-delete');

const treeContainer = document.getElementById('tree-container');

const STORAGE_KEY = 'chartOfAccountsTree';
let selectedAccountCode = null;

const deepClone = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

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
    if (!saved) return deepClone(defaultChartOfAccounts);
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    console.warn('Failed to load chart of accounts.', error);
  }
  return deepClone(defaultChartOfAccounts);
};

const saveTree = (nodes) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
};

let chartOfAccounts = loadTree();

const SCREEN_NAMES = {
  ar: {
    menu: 'القائمة',
    daily: 'اليومية',
    daily_sub1: 'القيود اليومية',
    daily_sub2: 'شاشة ترحيل القيود',
    daily_sub3: 'مراجعة القيود المرحّلة',
    daily_sub4: 'عرض القيود',
    daily_sub5: 'طباعة القيود',
    accounts: 'الحسابات',
    accounts_sub0: 'شجرة الحسابات',
    accounts_sub1: 'ميزان المراجعة',
    accounts_sub2: 'قائمة الدخل',
    accounts_sub3: 'قائمة المركز المالي',
    accounts_sub4: 'قائمة التدفقات النقدية',
    statement: 'كشف حساب',
    statement_sub0: 'كشف حسابات فرعية',
    statement_sub0b: 'كشف حسابات رئيسية',
    statement_sub1: 'كشف حساب عمميل',
    statement_sub2: 'أرصدة عملاء',
    statement_sub3: 'كشف حساب مورد',
    statement_sub4: 'أرصدة موردين',
    receipts_payments: 'السندات المالية',
    receipts_payments_sub: 'سندات الصندوق',
    receipts_payments_sub3: 'قيود السندات',
    vat: 'ضريبة القيمة المضافة',
    vat_sub1: 'ضريبة المبيعات',
    vat_sub2: 'ضريبة المشتريات',
    vat_sub3: 'الاقرار الضريبي',
    sales: 'المبيعات',
    sales_sub1: 'عرض سعر (Quotation)',
    sales_sub2: 'أمر بيع (Sales Order)',
    sales_sub3: 'فاتورة مبيعات (Sales Invoice)',
    sales_sub4: 'مرتجع مبيعات (Sales Return)',
    sales_sub5: 'بيانات العملاء (Customers)',
    sales_sub6: 'تعريف المندوبين (Sales Agents)',
    sales_sub7: 'تقارير المبيعات (Sales Reports)',
    purchases: 'المشتريات',
    purchases_sub1: 'طلب شراء (Purchase Requisition)',
    purchases_sub2: 'أمر شراء (Purchase Order)',
    purchases_sub3: 'فاتورة مشتريات (Purchase Invoice)',
    purchases_sub4: 'مرتجع مشتريات (Purchase Return)',
    purchases_sub5: 'بيانات الموردين (Suppliers)',
    purchases_sub6: 'إشعار استلام بضاعة (Goods Received Note)',
    purchases_sub7: 'تقارير المشتريات (Purchase Reports)',
    warehouses: 'المستودعات',
    warehouses_sub1: 'تعريف الأصناف',
    warehouses_sub2: 'إذن إضافة مخزني',
    warehouses_sub3: 'إذن صرف مخزني',
    warehouses_sub4: 'جرد المخزن',
    warehouses_sub5: 'تسوية مخزنية',
    warehouses_sub6: 'تعريف المستودعات',
    warehouses_sub7: 'تقارير حركة الأصناف والمخزون',
    human_resources: 'الموارد البشرية',
    human_resources_sub1: 'إعدادات هيكل الرواتب',
    human_resources_sub2: 'سجل السلف والقروض',
    human_resources_sub3: 'المكافآت والبدلات الاستثنائية',
    human_resources_sub4: 'الخصومات والجزاءات',
    human_resources_sub5: 'شاشة احتساب مسير الرواتب',
    human_resources_sub6: 'اعتماد صرف الرواتب',
    human_resources_sub7: 'تقارير الرواتب والتحويلات البنكية',
    settings: 'الإعدادات',
    settings_sub1: 'بيانات الشركة',
    settings_sub2: 'إدارة المستخدمين والصلاحات',
    settings_sub3: 'إعدادات السنة المالية',
    settings_sub4: 'تعريف العملات وأسعار الصرف',
    settings_sub5: 'إعدادات الضرائب',
    settings_sub6: 'إعدادات التنبيهات والرسائل',
    settings_sub7: 'النسخ الاحتياطي واستعادة البيانات',
    settings_sub8: 'سجل الأحداث / مراقبة النظام',
    settings_sub9: 'إعدادات الطابعات والتقارير',
  },
};

const menuGroups = [
  {
    key: 'daily',
    children: ['daily_sub1', 'daily_sub2', 'daily_sub3', 'daily_sub4', 'daily_sub5'],
  },
  {
    key: 'accounts',
    children: [
      'accounts_sub0',
      'accounts_sub1',
      'accounts_sub2',
      'accounts_sub3',
      'accounts_sub4',
    ],
  },
  {
    key: 'statement',
    children: [
      'statement_sub0',
      'statement_sub0b',
      'statement_sub1',
      'statement_sub2',
      'statement_sub3',
      'statement_sub4',
    ],
  },
  {
    key: 'receipts_payments',
    children: ['receipts_payments_sub', 'receipts_payments_sub3'],
  },
  {
    key: 'vat',
    children: ['vat_sub1', 'vat_sub2', 'vat_sub3'],
  },
  {
    key: 'sales',
    children: [
      'sales_sub1',
      'sales_sub2',
      'sales_sub3',
      'sales_sub4',
      'sales_sub5',
      'sales_sub6',
      'sales_sub7',
    ],
  },
  {
    key: 'purchases',
    children: [
      'purchases_sub1',
      'purchases_sub2',
      'purchases_sub3',
      'purchases_sub4',
      'purchases_sub5',
      'purchases_sub6',
      'purchases_sub7',
    ],
  },
  {
    key: 'warehouses',
    children: [
      'warehouses_sub1',
      'warehouses_sub2',
      'warehouses_sub3',
      'warehouses_sub4',
      'warehouses_sub5',
      'warehouses_sub6',
      'warehouses_sub7',
    ],
  },
  {
    key: 'human_resources',
    children: [
      'human_resources_sub1',
      'human_resources_sub2',
      'human_resources_sub3',
      'human_resources_sub4',
      'human_resources_sub5',
      'human_resources_sub6',
      'human_resources_sub7',
    ],
  },
  {
    key: 'settings',
    children: [
      'settings_sub1',
      'settings_sub2',
      'settings_sub3',
      'settings_sub4',
      'settings_sub5',
      'settings_sub6',
      'settings_sub7',
      'settings_sub8',
      'settings_sub9',
    ],
  },
];

let activeMenuKey = null;

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

const isNumericCode = (code) => /^\d+$/.test(code);

const updateDescendantCodes = (node, oldPrefix, newPrefix) => {
  if (!node.children) return;
  node.children.forEach((child) => {
    if (child.code.startsWith(oldPrefix)) {
      child.code = newPrefix + child.code.slice(oldPrefix.length);
    }
    updateDescendantCodes(child, oldPrefix, newPrefix);
  });
};

renderTree();

const renderMenu = () => {
  if (!menuContainer) return;
  if (menuTitle) {
    menuTitle.textContent = SCREEN_NAMES.ar.menu;
  }

  menuContainer.innerHTML = menuGroups
    .map((group) => {
      const childrenHtml = group.children
        .map((childKey) => {
          const activeClass = childKey === activeMenuKey ? 'active' : '';
          return `
            <button class="menu-item ${activeClass}" type="button" data-key="${childKey}">
              ${SCREEN_NAMES.ar[childKey]}
            </button>
          `;
        })
        .join('');

      return `
        <div class="menu-group">
          <button class="menu-parent" type="button" data-parent="${group.key}">
            ${SCREEN_NAMES.ar[group.key]}
            <span>▾</span>
          </button>
          <div class="menu-children">${childrenHtml}</div>
        </div>
      `;
    })
    .join('');
};

const setScreenContent = (title, description) => {
  if (screenTitle) screenTitle.textContent = title;
  if (screenDescription) screenDescription.textContent = description;
  if (screenBody) {
    screenBody.innerHTML = `
      <div class="placeholder-card">
        <h4>${title}</h4>
        <p>${description}</p>
      </div>
    `;
  }
};

const hideFinanceTree = () => {
  if (financeTreeSection) financeTreeSection.hidden = true;
};

const showFinanceTree = () => {
  if (financeTreeSection) financeTreeSection.hidden = false;
};

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

renderMenu();

if (menuContainer) {
  menuContainer.addEventListener('click', (event) => {
    const parentButton = event.target.closest('.menu-parent');
    if (parentButton && menuContainer.contains(parentButton)) {
      const children = parentButton.nextElementSibling;
      if (children) {
        children.hidden = !children.hidden;
      }
      return;
    }

    const itemButton = event.target.closest('.menu-item');
    if (!itemButton || !menuContainer.contains(itemButton)) return;
    const key = itemButton.dataset.key;
    activeMenuKey = key;
    renderMenu();

    const selectedLabel = SCREEN_NAMES.ar[key] ?? itemButton.textContent.trim();
    if (key === 'accounts_sub0') {
      showFinanceTree();
      setScreenContent('شجرة الحسابات', 'إدارة دليل الحسابات وإضافة الحسابات وتعديلها.');
      return;
    }

    hideFinanceTree();
    setScreenContent(selectedLabel, 'هذه الشاشة جاهزة لإضافة وظائفها المحاسبية.');
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
    const parentInfo = selectedAccountCode
      ? ` (تابع لـ ${selectedAccountCode})`
      : '';
    const newCode = prompt(`أدخل كود الحساب الجديد${parentInfo}:`);
    if (!newCode) return;
    const trimmedCode = newCode.trim();
    if (!isNumericCode(trimmedCode)) {
      alert('كود الحساب يجب أن يحتوي على أرقام فقط.');
      return;
    }
    if (codeExists(chartOfAccounts, trimmedCode)) {
      alert('هذا الكود موجود بالفعل. اختر كوداً مختلفاً.');
      return;
    }
    const newName = prompt('أدخل اسم الحساب الجديد:');
    if (!newName) return;

    const newAccount = { code: trimmedCode, name: newName.trim() };
    if (selectedAccountCode) {
      const found = findNodeByCode(chartOfAccounts, selectedAccountCode);
      if (found?.node) {
        if (!trimmedCode.startsWith(found.node.code)) {
          alert('كود الحساب يجب أن يبدأ بكود الحساب الأب.');
          return;
        }
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
    const trimmedCode = newCode.trim();
    if (!isNumericCode(trimmedCode)) {
      alert('كود الحساب يجب أن يحتوي على أرقام فقط.');
      return;
    }
    if (codeExists(chartOfAccounts, trimmedCode, found.node.code)) {
      alert('هذا الكود موجود بالفعل. اختر كوداً مختلفاً.');
      return;
    }
    const newName = prompt('أدخل الاسم الجديد:', found.node.name);
    if (!newName) return;

    if (found.parent && !trimmedCode.startsWith(found.parent.code)) {
      alert('كود الحساب يجب أن يبدأ بكود الحساب الأب.');
      return;
    }

    const oldCode = found.node.code;

    found.node.code = trimmedCode;
    found.node.name = newName.trim();
    if (oldCode !== trimmedCode) {
      updateDescendantCodes(found.node, oldCode, trimmedCode);
    }
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

setScreenContent('اختر شاشة من القائمة', 'سيتم عرض تفاصيل الشاشة هنا.');

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

