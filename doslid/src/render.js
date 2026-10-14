/** @typedef {import('./state.js').Show} Show */

/**
 * C1. Показує серіали в списку #results — по картці з шаблону #show-card на кожен, у тому
 * самому порядку, — і оновлює рядок статусу #status. Специфікація — ТЗ, C1.
 *
 * @param {readonly Show[]} list серіали, які треба показати
 */
export function renderShows(list) {
  const results = document.querySelector('#results');

  results.innerHTML = list
    .map(
      (show) => `
      <li class="card" data-id="${show.id}">
        <h3 class="card__title" lang="en">${show.name}</h3>
        <p class="card__meta">
          <span>${show.year}</span> · <span lang="en">${show.genres.join(', ')}</span>
        </p>
        <p class="card__rating">Оцінка TVmaze: <span>${show.rating}</span></p>
        <div class="card__actions">
          <button type="button" class="btn btn--toggle" data-action="toggle">До списку</button>
          <button type="button" class="btn" data-action="details">Детальніше</button>
        </div>
      </li>
    `,
    )
    .join('');
}
