const STATIC_MODE = window.location.hostname.includes('github.io');

const StaticStore = {
  load(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const StaticAPI = {
  token: null,
  async request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : null;

    const data = {
      users: StaticStore.load('users', []),
      accounts: StaticStore.load('accounts', []),
      customers: StaticStore.load('customers', []),
      suppliers: StaticStore.load('suppliers', []),
      receipts: StaticStore.load('receipts', []),
      payments: StaticStore.load('payments', []),
      journals: StaticStore.load('journals', []),
      journal_lines: StaticStore.load('journal_lines', []),
    };

    const saveAll = () => {
      Object.entries(data).forEach(([key, value]) => StaticStore.save(key, value));
    };

    if (path === '/api/auth/register' && method === 'POST') {
      if (!body?.email || !body?.password || !body?.name) {
        throw new Error('Missing fields');
      }
      if (data.users.some((u) => u.email === body.email)) {
        throw new Error('Email already exists');
      }
      const user = {
        id: createId(),
        name: body.name,
        email: body.email,
        password: body.password,
      };
      data.users.push(user);
      saveAll();
      return { id: user.id, name: user.name, email: user.email };
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const user = data.users.find(
        (u) => u.email === body?.email && u.password === body?.password
      );
      if (!user) throw new Error('Invalid credentials');
      return { token: 'static-token', user: { id: user.id, name: user.name, email: user.email } };
    }

    if (path === '/api/accounts' && method === 'GET') {
      return data.accounts;
    }
    if (path === '/api/accounts' && method === 'POST') {
      const item = {
        id: createId(),
        code: body.code,
        name: body.name,
        type: body.type,
        parent_id: body.parent_id || null,
      };
      data.accounts.push(item);
      saveAll();
      return item;
    }

    if (path === '/api/customers' && method === 'GET') return data.customers;
    if (path === '/api/customers' && method === 'POST') {
      const item = { id: createId(), balance: 0, ...body };
      data.customers.push(item);
      saveAll();
      return item;
    }

    if (path === '/api/suppliers' && method === 'GET') return data.suppliers;
    if (path === '/api/suppliers' && method === 'POST') {
      const item = { id: createId(), balance: 0, ...body };
      data.suppliers.push(item);
      saveAll();
      return item;
    }

    if (path === '/api/receipts' && method === 'GET') return data.receipts;
    if (path === '/api/receipts' && method === 'POST') {
      const item = { id: createId(), ...body };
      data.receipts.push(item);
      saveAll();
      return item;
    }

    if (path === '/api/payments' && method === 'GET') return data.payments;
    if (path === '/api/payments' && method === 'POST') {
      const item = { id: createId(), ...body };
      data.payments.push(item);
      saveAll();
      return item;
    }

    if (path === '/api/journals' && method === 'GET') return data.journals;
    if (path === '/api/journals' && method === 'POST') {
      const entry = {
        id: createId(),
        entry_date: body.entry_date,
        description: body.description || '',
      };
      data.journals.push(entry);
      (body.lines || []).forEach((line) => {
        data.journal_lines.push({ id: createId(), entry_id: entry.id, ...line });
      });
      saveAll();
      return entry;
    }

    if (path === '/api/reports/trial-balance' && method === 'GET') {
      const totals = {};
      data.accounts.forEach((acc) => {
        totals[acc.id] = { code: acc.code, name: acc.name, type: acc.type, total_debit: 0, total_credit: 0, balance: 0 };
      });
      data.journal_lines.forEach((line) => {
        const record = totals[line.account_id];
        if (!record) return;
        record.total_debit += Number(line.debit || 0);
        record.total_credit += Number(line.credit || 0);
        record.balance = record.total_debit - record.total_credit;
      });
      return Object.values(totals);
    }

    if (path === '/api/reports/income-statement' && method === 'GET') {
      const trial = await this.request('/api/reports/trial-balance');
      const revenue = trial
        .filter((row) => row.type === 'revenue')
        .reduce((sum, row) => sum + (row.total_credit - row.total_debit), 0);
      const expense = trial
        .filter((row) => row.type === 'expense')
        .reduce((sum, row) => sum + (row.total_debit - row.total_credit), 0);
      return { revenue, expense };
    }

    if (path === '/api/reports/balance-sheet' && method === 'GET') {
      const trial = await this.request('/api/reports/trial-balance');
      const assets = trial
        .filter((row) => row.type === 'asset')
        .reduce((sum, row) => sum + row.balance, 0);
      const liabilities = trial
        .filter((row) => row.type === 'liability')
        .reduce((sum, row) => sum + (row.total_credit - row.total_debit), 0);
      const equity = trial
        .filter((row) => row.type === 'equity')
        .reduce((sum, row) => sum + (row.total_credit - row.total_debit), 0);
      return { assets, liabilities, equity };
    }

    throw new Error('Unsupported operation in static mode');
  },
};

const API = STATIC_MODE
  ? StaticAPI
  : {
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

const handleError = (error) => {
  console.error(error);
  toast(error.message || 'حدث خطأ');
};

const authPanel = document.getElementById('auth-panel');
const appLayout = document.getElementById('app-layout');
const logoutBtn = document.getElementById('logout');
const screenTitle = document.getElementById('screen-title');
const screenBody = document.getElementById('screen-body');
const menu = document.getElementById('menu');
const screenButtons = document.getElementById('screen-buttons');
const menuTitle = document.getElementById('menu-title');
const menuPanel = document.getElementById('menu-panel');

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
    try {
      await API.request('/api/accounts', { method: 'POST', body: JSON.stringify(payload) });
      toast('تمت إضافة الحساب');
      renderAccounts();
    } catch (error) {
      handleError(error);
    }
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
    try {
      await API.request('/api/journals', { method: 'POST', body: JSON.stringify(payload) });
      toast('تم تسجيل القيد');
      renderJournals();
    } catch (error) {
      handleError(error);
    }
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
    try {
      await API.request(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      toast('تمت الإضافة');
      renderSimpleList(title, endpoint, formFields);
    } catch (error) {
      handleError(error);
    }
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

const renderSimpleScreen = (label) => {
  setScreen(label, `<div class="auth-card">تم فتح ${label}.</div>`);
};

menu.addEventListener('click', async (event) => {
  const button = event.target.closest('.menu-item');
  if (!button) return;
  const screen = button.dataset.screen;
  document.querySelectorAll('.menu-item').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  if (screenHandlers[screen]) {
    try {
      await screenHandlers[screen]();
    } catch (error) {
      handleError(error);
    }
  }
});

if (screenButtons) {
  screenButtons.addEventListener('click', (event) => {
    const button = event.target.closest('.screen-btn');
    if (!button) return;
    const label = button.textContent.trim();
    renderSimpleScreen(label);
  });
}

if (menuTitle && menuPanel) {
  menuPanel.hidden = false;
  menuTitle.style.cursor = 'pointer';
  menuTitle.addEventListener('click', () => {
    menuPanel.hidden = !menuPanel.hidden;
  });
}

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
  try {
    const data = await API.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    API.token = data.token;
    localStorage.setItem('token', data.token);
    showApp();
    toast('تم تسجيل الدخول');
  } catch (error) {
    handleError(error);
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target));
  try {
    await API.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    toast('تم إنشاء الحساب. يمكنك تسجيل الدخول الآن.');
  } catch (error) {
    handleError(error);
  }
});

const PIN_CODE = '868412';
const pinScreen = document.getElementById('pin-screen');
const pinForm = document.getElementById('pin-form');
const pinInput = document.getElementById('pin-input');
const pinStatus = document.getElementById('pin-status');

const unlockApp = () => {
  if (pinScreen) pinScreen.hidden = true;
  if (STATIC_MODE) {
    showApp();
  } else {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      API.token = savedToken;
      showApp();
    } else {
      showAuth();
    }
  }
};

if (pinForm) {
  pinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const entered = pinInput?.value?.trim();
    if (entered === PIN_CODE) {
      if (pinStatus) {
        pinStatus.textContent = 'تم الدخول بنجاح';
        pinStatus.className = 'status success';
      }
      unlockApp();
    } else {
      if (pinStatus) {
        pinStatus.textContent = 'رمز غير صحيح';
        pinStatus.className = 'status error';
      }
    }
  });
}

if (pinScreen) {
  authPanel.hidden = true;
  appLayout.hidden = true;
  pinScreen.hidden = false;
}
