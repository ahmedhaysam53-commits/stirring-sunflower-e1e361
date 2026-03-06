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

    const action = actionButton.getAttribute('data-action');
    if (action === 'close' || action === 'minimize') {
      windowElement.hidden = true;
      return;
    }

    if (action === 'maximize') {
      windowElement.classList.toggle('is-maximized');
    }
  });
});
