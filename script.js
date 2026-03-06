const PIN = '1221';

const form = document.getElementById('pin-form');
const input = document.getElementById('pin-input');
const status = document.getElementById('status');
const resetButton = document.getElementById('reset-btn');
const loginButton = document.getElementById('login-btn');
const loginScreen = document.getElementById('login-screen');
const excelScreen = document.getElementById('excel-screen');
const logoutButton = document.getElementById('logout-btn');

const setStatus = (message, type) => {
  status.textContent = message;
  status.classList.remove('success', 'error');
  if (type) {
    status.classList.add(type);
  }
};

const normalize = (value) => value.trim();

const handleLogin = () => {
  const value = normalize(input.value);

  if (value.length !== 4 || !/^[0-9]{4}$/.test(value)) {
    setStatus('الرجاء إدخال 4 أرقام صحيحة.', 'error');
    return;
  }

  if (value === PIN) {
    setStatus('تم تسجيل الدخول بنجاح ✅', 'success');
    window.location.href = 'main.html';
  } else {
    setStatus('رقم سري غير صحيح. حاول مرة أخرى.', 'error');
  }
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  handleLogin();
});

loginButton.addEventListener('click', handleLogin);

resetButton.addEventListener('click', () => {
  input.value = '';
  setStatus('');
  input.focus();
});

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    excelScreen.hidden = true;
    loginScreen.hidden = false;
    input.value = '';
    setStatus('');
    input.focus();
  });
}

input.addEventListener('input', () => {
  if (status.textContent) {
    setStatus('');
  }
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleLogin();
  }
});

input.focus();
