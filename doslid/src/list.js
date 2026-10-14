import { openDetails } from './details.js';
import { toggle } from './state.js';

/**
 * C2. Підключає кнопки карток у списку #results: «До списку» додає серіал до мого списку або
 * прибирає з нього, «Детальніше» відкриває діалог (openDetails з details.js). main.js викликає
 * цю функцію один раз, після першого показу списку. Специфікація — ТЗ, C2.
 *
 * @param {() => void} refresh перемальовує список для поточних фільтрів
 */
export function initList(refresh) {
  const results = document.querySelector('#results');
  const counter = document.querySelector('#watchlist-count');

  for (const button of results.querySelectorAll('[data-action="toggle"]')) {
    button.addEventListener('click', () => {
      const card = button.closest('.card');
      const inList = toggle(card.dataset.id);
      button.setAttribute('aria-pressed', String(inList));
      counter.textContent = String(results.querySelectorAll('[aria-pressed="true"]').length);
      refresh();
    });
  }

  for (const button of results.querySelectorAll('[data-action="details"]')) {
    button.addEventListener('click', () => {
      const card = button.closest('.card');
      openDetails(card.dataset.id);
    });
  }
}
