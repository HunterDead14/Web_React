/**
 * Courtly — mobile menu.
 *
 * Єдиний скрипт на сторінці: відкриває й закриває навігаційну панель під
 * header. Стан доступності тримаємо в aria-expanded, а вигляд панелі —
 * у класі .is-open (див. style.css).
 */
(function () {
  'use strict';

  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('primary-menu');

  if (!toggle || !nav) {
    return;
  }

  function setOpen(isOpen) {
    toggle.setAttribute('aria-expanded', String(isOpen));
    nav.classList.toggle('is-open', isOpen);
  }

  function isOpen() {
    return toggle.getAttribute('aria-expanded') === 'true';
  }

  toggle.addEventListener('click', function () {
    setOpen(!isOpen());
  });

  // Перехід за посиланням у панелі закриває меню.
  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) {
      setOpen(false);
    }
  });

  // Escape закриває меню й повертає фокус на кнопку.
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Клік поза header закриває відкриту панель.
  document.addEventListener('click', function (event) {
    if (isOpen() && !event.target.closest('.site-header')) {
      setOpen(false);
    }
  });

  // На desktop панель не потрібна: при переході через 1024 px закриваємо її,
  // щоб aria-expanded не залишався в стані true.
  var desktop = window.matchMedia('(min-width: 64rem)');

  function closeOnDesktop() {
    if (desktop.matches) {
      setOpen(false);
    }
  }

  desktop.addEventListener('change', closeOnDesktop);
  window.addEventListener('resize', closeOnDesktop);
})();
