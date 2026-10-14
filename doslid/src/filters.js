/** @typedef {import('./state.js').Filters} Filters */

const form = document.querySelector('#filters');

/**
 * C3. Повертає поточні значення форми фільтрів #filters. Поки C3 не виконано, фільтрів немає,
 * і список показує всі серіали. Специфікація — ТЗ, C3.
 *
 * @returns {Filters}
 */
export function readFilters() {
  return {
    query: form.elements.query.value,
    genre: form.elements.genre.value,
    mine: form.elements.mine.checked,
  };
}

/**
 * C3. Підключає форму фільтрів: після кожної зміни — refresh(). main.js викликає цю функцію
 * один раз. Специфікація — ТЗ, C3.
 *
 * @param {() => void} refresh перемальовує список для поточних фільтрів
 */
export function initFilters(refresh) {
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);

  // Enter у полі пошуку надсилає форму, а це перезавантажило б сторінку й стерло стан.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    refresh();
  });

  // Подія reset приходить до того, як браузер очистить поля, тож власним очищенням ми
  // гарантуємо, що refresh() прочитає вже порожні значення.
  form.addEventListener('reset', (event) => {
    event.preventDefault();
    for (const field of form.elements) {
      if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) {
        field.checked = false;
      } else if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
        field.value = '';
      }
    }
    refresh();
  });
}
