import http from 'node:http';

const baseUrl = process.argv[2];
const width = Number(process.argv[3] || 1280);
const getJson = (url) => new Promise((resolve, reject) => {
  http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => resolve(JSON.parse(data)));
  }).on('error', reject);
});
const targets = await getJson('http://127.0.0.1:9223/json/list');
const target = targets.find((t) => t.type === 'page' && t.url.startsWith(baseUrl));
if (!target) throw new Error('target not found: ' + baseUrl);

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let seq = 0;
const pending = new Map();
let errors = [];
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  } else if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    errors.push({ kind: 'exception', text: d.text, line: d.lineNumber, url: d.url });
  } else if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
    errors.push({ kind: msg.params.type, text: msg.params.args.map((a) => a.value ?? a.description).join(' ') });
  }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const reset = async () => {
  errors = [];
  await send('Page.reload', { ignoreCache: true });
  await send('Page.bringToFront');
  await sleep(400);
  for (let i = 0; i < 40; i++) {
    const state = await evaluate(`({
      ready: document.readyState,
      status: document.getElementById('status')?.textContent,
      cards: document.querySelectorAll('.venue-card').length,
    })`);
    if (state.ready === 'complete' && state.cards === 6 && state.status?.startsWith('Популярні майданчики:')) return;
    await sleep(100);
  }
  throw new Error('initial state did not render after reload');
};
const status = () => evaluate(`({ text: document.getElementById('status').textContent, busy: document.getElementById('results').getAttribute('aria-busy') })`);
const cards = () => evaluate(`([...document.querySelectorAll('.venue-card')].map((c) => ({ name: c.querySelector('h3')?.textContent, city: c.querySelector('.venue-card__city')?.textContent, price: c.querySelector('.price')?.textContent.trim(), rating: c.querySelector('.rating')?.textContent.trim() })))`);
const setForm = (city, sport = '') => evaluate(`(() => { const f = document.getElementById('search-form'); f.city.value = ${JSON.stringify(city)}; f.sport.value = ${JSON.stringify(sport)}; return true; })()`);
const submit = () => evaluate(`document.getElementById('search-form').requestSubmit()`);
const realClick = async (selector) => {
  const point = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
};

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });

// 3.1 Header and mobile menu
await reset();
const header = await evaluate(`(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  const bookings = document.querySelector('.bookings-toggle');
  return {
    menuDisplay: getComputedStyle(menu).display,
    menuAriaBefore: menu.getAttribute('aria-expanded'),
    navBefore: nav.className,
    bookingsLabel: bookings.querySelector('.bookings-toggle__label').textContent,
    count: document.getElementById('bookings-count').textContent,
  };
})()`);
let menuAfter = null;
let menuClosed = null;
if (header.menuDisplay !== 'none') {
  await realClick('.menu-toggle');
  await sleep(80);
  menuAfter = await evaluate(`({ aria: document.querySelector('.menu-toggle').getAttribute('aria-expanded'), nav: document.getElementById('site-nav').className })`);
  await realClick('.menu-toggle');
  await sleep(80);
  menuClosed = await evaluate(`({ aria: document.querySelector('.menu-toggle').getAttribute('aria-expanded'), nav: document.getElementById('site-nav').className })`);
}
await realClick('.bookings-toggle');
await sleep(80);
const bookingsClick = await evaluate(`({ dialog: document.getElementById('bookings-dialog').open, nav: document.getElementById('site-nav').className, menuAria: document.querySelector('.menu-toggle').getAttribute('aria-expanded'), bookingsAria: document.querySelector('.bookings-toggle').getAttribute('aria-expanded') })`);
await evaluate(`document.getElementById('bookings-dialog').close()`);
const headerResult = { ...header, menuAfter, menuClosed, bookingsClick, errors: errors.slice() };

// 3.2 Initial state
await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
await reset();
const initial = { status: await status(), cards: await cards(), errors: errors.slice() };
await realClick('.bookings-toggle');
await sleep(50);
const bookingsInitial = await evaluate(`({ open: document.getElementById('bookings-dialog').open, empty: document.getElementById('bookings-empty').textContent, emptyHidden: document.getElementById('bookings-empty').hidden, list: document.getElementById('bookings-list').children.length })`);
await evaluate(`document.getElementById('bookings-dialog').close()`);

// 3.3 Search scenarios
const searchResults = {};
await reset();
await setForm('Київ');
await submit();
const kyivImmediate = await status();
await sleep(2600);
searchResults.kyiv = { immediate: kyivImmediate, final: await status(), cards: await cards(), errors: errors.slice() };

await reset();
await setForm('Львів');
await submit();
const lvivImmediate = await status();
await sleep(1600);
searchResults.lviv = { immediate: lvivImmediate, final: await status(), cards: await cards(), errors: errors.slice() };

await reset();
await setForm('Одеса');
await submit();
await sleep(1600);
searchResults.odesa = { final: await status(), cards: await cards(), errors: errors.slice() };
await realClick('.venue-card__book');
await sleep(80);
searchResults.odesa.cardClick = await evaluate(`({ open: document.getElementById('booking-dialog').open, name: document.querySelector('#booking-dialog [data-field="name"]').textContent })`);
if (searchResults.odesa.cardClick.open) await evaluate(`document.getElementById('booking-dialog').close()`);

await reset();
await setForm('Дніпро', 'Волейбол');
await submit();
await sleep(1600);
searchResults.empty = { final: await status(), cards: await cards(), errors: errors.slice() };

await reset();
await setForm('', '');
await submit();
await sleep(1600);
searchResults.all = { final: await status(), cards: await cards(), errors: errors.slice() };

// last search wins
await reset();
await setForm('Київ');
await submit();
await sleep(120);
await setForm('Одеса');
await submit();
await sleep(3200);
searchResults.race = { formCity: await evaluate(`document.getElementById('search-form').city.value`), final: await status(), cards: await cards(), errors: errors.slice() };

// 3.4-3.6 booking dialog / confirm / my bookings
await reset();
await realClick('.venue-card__book');
await sleep(80);
const bookingBefore = await evaluate(`(() => {
  const d = document.getElementById('booking-dialog');
  const times = [...document.querySelectorAll('#booking-time option')].map((o) => o.value);
  const durations = [...document.querySelectorAll('#booking-hours option')].map((o) => o.textContent.trim());
  return {
    open: d.open,
    name: d.querySelector('[data-field="name"]').textContent,
    place: d.querySelector('[data-field="place"]').textContent,
    date: d.querySelector('[data-field="date"]').textContent,
    total1: d.querySelector('[data-field="total"]').textContent,
    times, durations,
  };
})()`);
await evaluate(`(() => { const h = document.getElementById('booking-hours'); h.value = '3'; h.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
await sleep(50);
const total3 = await evaluate(`document.querySelector('#booking-dialog [data-field="total"]').textContent`);
await realClick('#booking-dialog [data-action="cancel"]');
await sleep(50);
const afterCancel = await evaluate(`({ open: document.getElementById('booking-dialog').open, focus: document.activeElement?.className })`);
await realClick('.venue-card__book');
await sleep(50);
await evaluate(`(() => { const h = document.getElementById('booking-hours'); h.value = '3'; h.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
await realClick('#booking-form button[type="submit"]');
await sleep(100);
const afterConfirm = await evaluate(`({ dialogOpen: document.getElementById('booking-dialog').open, count: document.getElementById('bookings-count').textContent, list: document.getElementById('bookings-list').children.length, emptyHidden: document.getElementById('bookings-empty').hidden, focus: document.activeElement?.className })`);
await realClick('.bookings-toggle');
await sleep(50);
const myBookings = await evaluate(`({ open: document.getElementById('bookings-dialog').open, list: document.getElementById('bookings-list').children.length, empty: document.getElementById('bookings-empty').textContent, emptyHidden: document.getElementById('bookings-empty').hidden })`);
await evaluate(`document.getElementById('bookings-dialog').close()`);

console.log(JSON.stringify({
  url: baseUrl,
  width,
  header: headerResult,
  initial: { ...initial, bookingsInitial },
  search: searchResults,
  booking: { before: bookingBefore, total3, afterCancel, afterConfirm, myBookings, errors: errors.slice() },
}, null, 2));
ws.close();
