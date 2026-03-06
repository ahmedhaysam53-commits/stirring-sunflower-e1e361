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

if (mainButton && dropdown) {
  mainButton.addEventListener('click', () => {
    dropdown.hidden = !dropdown.hidden;
  });

  document.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target) && event.target !== mainButton) {
      dropdown.hidden = true;
    }
  });
}
