/* Courtly Booking — entry point */

import { fetchVenues } from './api.js';
import { renderResults } from './render.js';
import { openBooking } from './booking.js';
import { toISODate } from './format.js';

const form = document.getElementById('search-form');
const results = document.getElementById('results');
const status = document.getElementById('status');

// Venues currently on screen
let venues = [];

/* Mobile menu */

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.getElementById('site-nav');

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  siteNav.classList.toggle('is-open', !isOpen);
});

/* Search */

form.date.value = toISODate(new Date());

function readFilters() {
  return { city: form.city.value, sport: form.sport.value };
}

let searchToken = 0;

async function handleSearch(event) {
  event.preventDefault();
  const token = ++searchToken;
  status.textContent = 'Шукаємо…';
  results.setAttribute('aria-busy', 'true');

  const found = await fetchVenues(readFilters());
  if (token !== searchToken) return;

  renderResults(results, found);
  venues = found;
  results.setAttribute('aria-busy', 'false');
  // Status line, announced by screen readers (role="status")
  status.textContent = found.length ? `Знайдено: ${found.length}` : 'Нічого не знайдено';
}

form.addEventListener('submit', handleSearch);

/* Booking */

// Delegation: cards are re-created by renderResults(), their nodes cannot keep listeners.
results.addEventListener('click', (event) => {
  const button = event.target.closest('.venue-card__book');
  if (!button) return;
  const venue = venues.find((item) => item.id === button.dataset.id);
  openBooking(venue, form.date.value || toISODate(new Date()));
});

/* Initial state: popular venues */

venues = await fetchVenues({ popular: true });
renderResults(results, venues);
results.setAttribute('aria-busy', 'false');
status.textContent = `Популярні майданчики: ${venues.length}`;
