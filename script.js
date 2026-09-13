const button = document.getElementById('actionBtn');
const counterSpan = document.getElementById('counter');
const themeToggle = document.getElementById('themeToggle');
let count = 0;

button.addEventListener('click', () => {
  count++;
  counterSpan.textContent = count;
});

const applyTheme = (theme) => {
  const isDark = theme === 'dark';

  document.body.classList.toggle('dark-theme', isDark);
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.textContent = isDark
    ? 'Увімкнути світлу тему'
    : 'Увімкнути темну тему';
};

applyTheme(localStorage.getItem('theme'));

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  applyTheme(isDark ? 'dark' : 'light');
});