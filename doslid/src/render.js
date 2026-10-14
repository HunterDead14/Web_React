/** @typedef {import('./state.js').Show} Show */
import { notes, shows, watchlist } from './state.js';

const results = document.querySelector('#results');
const status = document.querySelector('#status');
const cardTemplate = document.querySelector('#show-card');

/** Порожнє значення в даних показуємо прочерком. */
const DASH = '—';

/**
 * C1. Показує серіали в списку #results — по картці з шаблону #show-card на кожен, у тому
 * самому порядку, — і оновлює рядок статусу #status. Специфікація — ТЗ, C1.
 *
 * @param {readonly Show[]} list серіали, які треба показати
 */
export function renderShows(list) {
  const cards = list.map((show) => createCard(show));
  results.replaceChildren(...cards);

  status.textContent = cards.length
    ? `Знайдено: ${cards.length} з ${shows.length}`
    : 'Нічого не знайдено';
}

/**
 * Картка — клон шаблону #show-card. Дані потрапляють у DOM лише текстом (textContent) або
 * значенням атрибута, тому розмітка в назві серіалу лишається текстом.
 *
 * @param {Show} show
 * @returns {HTMLLIElement}
 */
function createCard(show) {
  const card = cardTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.id = String(show.id);

  setField(card, 'name', show.name);
  setField(card, 'year', show.year ?? DASH);
  setField(card, 'rating', show.rating ?? DASH);
  setField(card, 'genres', show.genres.length ? show.genres.join(', ') : DASH);

  // Стан «До списку» живе в state.js, тож кожна перемальована картка бере його звідти: текст і
  // ім'я кнопки при цьому не змінюються, стан передає лише aria-pressed.
  card
    .querySelector('[data-action="toggle"]')
    .setAttribute('aria-pressed', String(watchlist.has(show.id)));

  const note = notes.get(show.id);
  if (note) {
    setField(card, 'my-rating', note.rating);
    card.querySelector('.card__mine').hidden = false;

    const noteBlock = card.querySelector('.card__note');
    noteBlock.textContent = note.text;
    noteBlock.hidden = note.text === '';
  }

  return card;
}

/**
 * Заповнює всі місця [data-field] на картці: одне поле трапляється кілька разів — назва є і в
 * заголовку, і в прихованих частинах імен обох кнопок.
 *
 * @param {HTMLElement} card
 * @param {string} field
 * @param {string | number} value
 */
function setField(card, field, value) {
  for (const node of card.querySelectorAll(`[data-field="${field}"]`)) {
    node.textContent = String(value);
  }
}
