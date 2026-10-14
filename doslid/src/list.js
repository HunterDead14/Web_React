import { openDetails } from './details.js';
import { readFilters } from './filters.js';
import { toggle, watchlist } from './state.js';

const results = document.querySelector('#results');
const counter = document.querySelector('#watchlist-count');
const resultsHeading = document.querySelector('#results-heading');

/**
 * C2. Підключає кнопки карток у списку #results: «До списку» додає серіал до мого списку або
 * прибирає з нього, «Детальніше» відкриває діалог (openDetails з details.js). main.js викликає
 * цю функцію один раз, після першого показу списку. Специфікація — ТЗ, C2.
 *
 * Один обробник на всьому списку: картки перемальовуються, тож обробники на самих кнопках
 * гинули б разом із ними.
 *
 * @param {() => void} refresh перемальовує список для поточних фільтрів
 */
export function initList(refresh) {
  results.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const card = button.closest('[data-id]');
    if (!card) return;

    const id = Number(card.dataset.id);

    if (button.dataset.action === 'toggle') {
      toggleWithFocus(id, refresh);
    } else {
      openDetails(id);
    }
  });
}

/**
 * Перемикає серіал у моєму списку й повертає фокус туди, де він має лишитися: на «До списку»
 * тієї самої картки, а якщо з увімкненим «Лише мій список» картка зникає — на сусідню.
 *
 * @param {number} id
 * @param {() => void} refresh
 */
function toggleWithFocus(id, refresh) {
  const inList = toggle(id);
  counter.textContent = String(watchlist.size);

  const removal = !inList && Boolean(readFilters().mine);
  const nextId = removal ? neighbourId(id) : id;

  // Фокус переводимо в тому самому обробнику: відкладені колбеки лишили б його на <body>.
  refresh();

  if (nextId === null) {
    resultsHeading.focus();
  } else {
    toggleButton(nextId)?.focus();
  }
}

/**
 * @param {number} id
 * @returns {HTMLButtonElement | null}
 */
function toggleButton(id) {
  return results.querySelector(`[data-id="${id}"] [data-action="toggle"]`);
}

/**
 * Id сусідньої картки: наступної, якщо її немає — попередньої, якщо карток не лишилося — null.
 *
 * @param {number} id
 * @returns {number | null}
 */
function neighbourId(id) {
  const cards = [...results.querySelectorAll('[data-id]')];
  const index = cards.findIndex((card) => Number(card.dataset.id) === id);
  const neighbour = cards[index + 1] ?? cards[index - 1];
  return neighbour ? Number(neighbour.dataset.id) : null;
}
