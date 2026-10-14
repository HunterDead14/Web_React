import { getShow, saveNote } from './state.js';

const dialog = document.querySelector('#details');
const title = document.querySelector('#details-title');
const summary = document.querySelector('#details-summary');
const link = document.querySelector('#details-link');
const form = document.querySelector('#note-form');
const ratingInput = document.querySelector('#note-rating');
const errorText = document.querySelector('#note-rating-error');

/** id серіалу, який зараз показує діалог. */
let currentId = null;

/**
 * C4. Відкриває діалог #details для серіалу: назва, опис, посилання на сторінку TVmaze і форма
 * з моєю оцінкою й нотаткою. Специфікація — ТЗ, C4.
 *
 * @param {number} id
 */
export function openDetails(id) {
  const show = getShow(id);
  currentId = id;

  title.textContent = show.name;
  summary.innerHTML = show.summary;
  link.href = show.url;

  dialog.showModal();
}

/**
 * C4. Підключає діалог #details: закриття й форму «Моя оцінка й нотатка». main.js викликає цю
 * функцію один раз. Специфікація — ТЗ, C4.
 *
 * @param {() => void} refresh перемальовує список для поточних фільтрів
 */
export function initDetails(refresh) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const rating = Number(ratingInput.value);
    if (rating < 1 || rating > 10) {
      errorText.textContent = 'Оцінка має бути цілим числом від 1 до 10';
      return;
    }

    saveNote(currentId, { rating, text: form.elements.note.value });
    dialog.close();
    refresh();
  });

  for (const button of dialog.querySelectorAll('button')) {
    if (button.type !== 'submit') {
      button.addEventListener('click', () => dialog.close());
    }
  }
}
