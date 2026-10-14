import { getShow, notes, saveNote } from './state.js';

const dialog = document.querySelector('#details');
const title = document.querySelector('#details-title');
const summary = document.querySelector('#details-summary');
const link = document.querySelector('#details-link');
const form = document.querySelector('#note-form');
const ratingInput = document.querySelector('#note-rating');
const noteInput = document.querySelector('#note-text');
const errorText = document.querySelector('#note-rating-error');
const cancelButton = form.querySelector('button[type="button"]');
const status = document.querySelector('#status');
const results = document.querySelector('#results');

const RATING_ERROR = 'Оцінка має бути цілим числом від 1 до 10';

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
  // Опис TVmaze — HTML-розмітка, але показати його треба як текст, тож спершу розбираємо її в
  // окремому документі й дістаємо звідти сам текст.
  summary.textContent = summaryToText(show.summary);
  link.href = show.url;

  const note = notes.get(id);
  ratingInput.value = note ? String(note.rating) : '';
  noteInput.value = note ? note.text : '';
  clearRatingError();

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
    if (currentId === null) return;

    const rating = ratingInput.valueAsNumber;
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
      showRatingError();
      return;
    }

    const id = currentId;
    const show = getShow(id);
    saveNote(id, { rating, text: noteInput.value });

    dialog.close();
    refresh();
    // Картку перемальовано, тож «Детальніше» — уже нова кнопка: фокус переводимо в тому самому
    // обробнику, інакше він лишиться на <body>.
    results.querySelector(`[data-id="${id}"] [data-action="details"]`)?.focus();
    status.textContent = `Нотатку до ${show.name} збережено`;
  });

  // Щойно значення виправили, помилка зникає.
  ratingInput.addEventListener('input', () => {
    if (ratingInput.hasAttribute('aria-invalid')) clearRatingError();
  });

  cancelButton.addEventListener('click', () => dialog.close());
}

function showRatingError() {
  errorText.textContent = RATING_ERROR;
  ratingInput.setAttribute('aria-invalid', 'true');
  ratingInput.focus();
}

function clearRatingError() {
  errorText.textContent = '';
  ratingInput.removeAttribute('aria-invalid');
}

/**
 * Текст опису без розмітки TVmaze. Розбір іде в окремому, неробочому документі: у DOM застосунку
 * не потрапляє жодного елемента з опису, скрипти й обробники з нього не виконуються, а картинки
 * не завантажуються.
 *
 * @param {string} html
 * @returns {string}
 */
function summaryToText(html) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const blocks = [...parsed.body.children].map((block) => block.textContent.trim());
  return (blocks.length ? blocks.join('\n\n') : parsed.body.textContent).trim();
}
