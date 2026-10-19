# ЛР-10. AI-агент для JavaScript debugging


## 1. Дослідницькі завдання (§4)

### 4.1. Console і типи помилок

Я перевірив кілька типів помилок прямо в Console:

| Тип | Що зробив | Повідомлення | Висновок |
|---|---|---|---|
| SyntaxError | `const = 1` | `Unexpected token '='` | Скрипт не виконується взагалі |
| ReferenceError | `renderBookingsCount()` | `renderBookingsCount is not defined` | Звернення до неоголошеної назви |
| TypeError | `formatPrice(undefined)` / пошук «Львів» | `Cannot read properties of undefined (reading 'toLocaleString')` | Операція над `undefined` |
| Promise.reject | `Promise.reject(new Error('demo'))` | `Uncaught (in promise) Error: demo` | Відхилений проміс без `catch` |
| SyntaxError (JSON) | `JSON.parse('{bad}')` | `Expected property name or '}' in JSON at position 1` | Помилка розбору, але під час виконання |

Висновки:
- Найважливіша помилка — перший червоний запис після дії. Наступні часто є наслідком.
- Клік по запису в Console відкриває Sources на місці помилки.
- `(in promise)` означає лише те, що проміс відхилено, а не окремий тип помилки.

### 4.2. Stack Trace і Sources

- Стек читаю зверху вниз: перший кадр — місце зупинки, останній — точка входу.
- Для `setTimeout` є кадр без файлу, під ним — безіменний колбек.
- Верхній кадр показує, де помилка проявилась, але не завжди причину. У застосунку це `format.js:5`, а причина була в даних.
- Watch працює тільки на вибраному кадрі: на кадрі `formatPrice` змінна `venue` недоступна, а на кадрі `createCard` — доступна.

![Рис. 4.2.6. Пауза на format.js:5: value: undefined](zvit-img/4-2-6-pause-value-undefined.png)

### 4.3. DOM у DevTools

| Перевірка | Результат |
|---|---|
| `getEventListeners($0)` на картці до пошуку | `click: 1` |
| `getEventListeners($0)` на новій картці після пошуку | `{}` |
| `querySelectorAll('.venue-card').length` (збережений список) | 6 |
| `getElementsByClassName('venue-card').length` | 2 |

`querySelectorAll` повертає статичний список, а `getElementsByClassName` — живу колекцію. Слухачі прив'язані до конкретного вузла, а не до селектора, тому після `innerHTML` нові кнопки без слухачів.

![Рис. 4.3.1. getEventListeners($0) на картці](zvit-img/4-3-1-listeners-card.png)

### 4.4. Event Loop

Результат експерименту: `1 5 7 3 4 6 2`.

Порядок такий: синхронний код, потім microtasks (`.then`, `queueMicrotask`, продовження після `await`), потім task (`setTimeout`). `setTimeout(fn, 0)` не означає «одразу».

![Рис. 4.4.1. Порядок виконання в Console](zvit-img/4-4-1-event-loop.png)

### 4.5. AI-assisted debugging

| Допоміг | Помилився |
|---|---|
| Зіставив `undefined` у `formatPrice` з ключем `pricePerhour` у `venues.json` | Радив `priceperhour` замість `pricePerhour`, Console знову показала `undefined` |
| Запропонував кілька гіпотез і перевірки через `Object.keys` | Стверджував наявність кадру `(async)`, скріншот показав протилежне |
| Швидко знайшов потрібний код через пошук | Прогнозував `typeof v` як `"undefined"`, реально було `<not available>` |

---

## 2. Сценарій A — TypeError при пошуку у Львові

**Очікувано (ТЗ):** 3 картки (Smash Club 500, Green Field 400, Royal Court 1 200 грн/год), статус «Знайдено: 3», Console порожня.

**Фактично (HEAD):** після «Знайти» список лишився з 6 популярними картками, статус «Знайдено: 6», у Console `TypeError`.

**Кроки:**
1. Відкрити HEAD на `127.0.0.1:8010`, очистити Console.
2. Вибрати місто Львів, вид «Усі види», натиснути «Знайти».
3. Для зупинки увімкнути Pause on uncaught exceptions.

**Console до виправлення:**

```text
Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'toLocaleString')
    at formatPrice (format.js:5:19)
    at createCard (render.js:19:42)
    at Array.map (<anonymous>)
    at renderResults (render.js:29:32)
    at HTMLFormElement.handleSearch (main.js:40:3)
```

**Scope на паузі:** у `formatPrice` значення `value: undefined`. На кадрі `createCard`: `venue` — це `royal-court`, `venue.pricePerHour` дає `undefined`, `venue.pricePerhour` дає `1200`. Ключ у `data/venues.json` написано з малою `h`.

**Гіпотези:**

| # | Хто | Гіпотеза | Перевірка | Результат |
|---|---|---|---|---|
| 1 | Я | У даних немає ціни або вона `null` | `Object.keys(venue)`, `'pricePerHour' in venue` | Відкинуто: значення `1200` є, але лежить під ключем `pricePerhour` |
| 2 | AI | Регістр ключа: `pricePerhour` замість `pricePerHour` | `venue.pricePerhour`, `formatPrice(1200)`, `formatPrice(undefined)` | Підтверджено |
| 3 | Я | `venue` не той об'єкт або гонка | `typeof royal`, `fetchVenues` | Відкинуто: 3 коректні об'єкти |

**Prompt:**

```text
Проаналізуй цю помилку як senior JavaScript debugger. Назви 2–3 можливі першопричини, спираючись лише на Console, Stack Trace і код. Для кожної запропонуй перевірку в DevTools. Код не змінюй.
```

**Відповідь AI (коротко):** найімовірніше — регістр ключа; можливо, поле відсутнє або дані мають іншу форму; можливо, застарілий об'єкт. Код агент не змінював.

**Виправлення:** одна зміна в `data/venues.json`:

```diff
-    "pricePerhour": 1200,
+    "pricePerHour": 1200,
```

Я не додавав `?? 0` чи `?.`, бо це приховало б помилку.

**Коміт:** [`39c0965`](https://github.com/HunterDead14/Web_React/commit/39c0965113f6f9fdf202f662826dec1eca7c2daa). Окремо виправив ще один дефект, `renderBookingsCount is not defined` — [`c3ccb88`](https://github.com/HunterDead14/Web_React/commit/c3ccb88c3e4a166a305c99d9c62d595462e675a0).

**Після виправлення:** 3 картки з цінами 500 / 400 / 1 200, Console порожня, діалог Royal Court показує 1 200 грн. Статус «Знайдено: 3» з'явився після виправлення C.

![Рис. 5.3.1. До виправлення: після пошуку Львова статус 6](zvit-img/5-3-before-results.png)

![Рис. 5.3.2. Після виправлення: 3 картки Львова](zvit-img/5-3-after-results.png)

---

## 3. Сценарій B — кнопка не працює після пошуку

**Очікувано:** після пошуку «Одеса» клік на «Забронювати» в Active Hall відкриває діалог із ціною 380 грн.

**Фактично:** 2 картки є, але діалог не відкривається, Console порожня.

**Кроки:**
1. Відкрити HEAD, вибрати Одеса, натиснути «Знайти».
2. Натиснути «Забронювати» на Active Hall.
3. Перевірити DOM і слухачі через Elements і Console.

**Стан DOM і запити в Console:**

| Запит | До пошуку | Після пошуку |
|---|---|---|
| `#results.children.length` | 6 | 2 |
| `getEventListeners($0)` на старій кнопці | `{click: 1}` | — |
| `getEventListeners($0)` на новій кнопці | — | `{}` |
| `old.isConnected` (стара кнопка) | `true` | `false` |

Кнопка нова має `data-id="active-hall"`, але слухача немає.

**Гіпотези:**

| # | Хто | Гіпотеза | Перевірка | Результат |
|---|---|---|---|---|
| 1 | Я | `innerHTML` знищує слухачі старих вузлів | `getEventListeners`, `isConnected` | Підтверджено |
| 2 | AI | `bindBookButtons()` не викликається після пошуку | Пошук у `main.js` | Підтверджено |
| 3 | AI | Неправильний `data-id` | `$0.dataset.id`, `venues` | Відкинуто: `id` збігається |

**Prompt:**

```text
Проаналізуй цей DOM-дефект як senior JavaScript debugger. Після пошуку «Одеса» клік «Забронювати» на Active Hall не відкриває діалог, Console порожня. #results має 2 картки, getEventListeners на старій кнопці — click: 1, на новій — {}. Назви 2–3 першопричини і перевірки в DevTools. Код не змінюй.
```

**Відповідь AI (коротко):** слухачі прив'язані до старих вузлів; після пошуку їх не прив'язують повторно; можливо, неправильний `data-id`. Перші дві підтвердилися, третю відкинуто.

**Виправлення:** делегований слухач на стабільному `#results`:

```js
results.addEventListener('click', (event) => {
  const button = event.target.closest('.venue-card__book');
  if (!button) return;
  const venue = venues.find((item) => item.id === button.dataset.id);
  openBooking(venue, form.date.value || toISODate(new Date()));
});
```

`bindBookButtons()` я прибрав. `closest()` потрібен, бо клік може прийти на вкладений `<span>`.

**Коміт:** [`8a1804e`](https://github.com/HunterDead14/Web_React/commit/8a1804efa2012087b9283e7fd1d77479e8ffbdbb).

**Після виправлення:** клік на Active Hall відкриває діалог із 380 грн, Console порожня.

![Рис. 5.4.1. До виправлення: 2 картки, але діалог не відкривається](zvit-img/5-4-before-results.png)

![Рис. 5.4.2. Після виправлення: getEventListeners($0) на кнопці — {}, але на #results є click](zvit-img/5-4-after-delegation.png)

---

## 4. Сценарій C — гонка двох пошуків (Event Loop)

**Очікувано:** після «Київ» і потім «Одеса» на екрані 2 картки Одеси, статус «Знайдено: 2».

**Фактично:** форма показує «Одеса», але список містить 3 картки Києва, статус «Знайдено: 6».

**Фактичні логи** (тимчасові `console.log` у HEAD-копії):

```text
[search] start Київ 22958
[status listener] 6 22961
[search] start Одеса 23082
[status listener] 6 23082
[search] resolved Одеса 23483
[render] Одеса 23483
[search] resolved Київ 24162
[render] Київ 24163
```

**Пояснення:** обидва запити стартують синхронно і чекають свій `await`. Відповідь Одеси приходить раніше (+525 мс), Києва — пізніше (+1204 мс), і пізніша відповідь перезаписує екран. `await` не знає, який запит останній.

**Схема:**

```text
submit Київ  t=0    → await fetchVenues → таймер 1200 ms
submit Одеса t=124  → await fetchVenues → таймер 400 ms
t≈525   resolve Одеса → render → DOM: Одеса (2)
t≈1204  resolve Київ  → render → DOM: Київ (3)  ← застаріла відповідь
```

Статус «6» виникає, бо другий `submit`-слухач рахує старі картки синхронно, до рендеру.

**Гіпотези:**

| # | Хто | Гіпотеза | Перевірка | Результат |
|---|---|---|---|---|
| 1 | Я | Відповіді приходять у порядку таймерів, а не запитів | Логи start/resolved/render | Підтверджено |
| 2 | AI | Потрібен токен запиту | Порівняння після `await` | Підтверджено |
| 3 | AI | Статус рахується до рендеру | Лог у submit-слухачі | Підтверджено |

**Prompt:**

```text
Проаналізуй дефект Event Loop як senior JavaScript debugger. Після Київ, а потім Одеса на екрані має залишитися Одеса (2 картки), а фактично показується Київ (3 картки), статус 6. Ось логи з performance.now() і код handleSearch з await. Назви 2–3 першопричини і перевірки. Код не змінюй.
```

**Відповідь AI (коротко):** гонка двох `await`; потрібен номер запиту; `setTimeout` тут не допоможе.

**Виправлення:**

```js
let searchToken = 0;

async function handleSearch(event) {
  event.preventDefault();
  const token = ++searchToken;
  // ...
  const found = await fetchVenues(readFilters());
  if (token !== searchToken) return;
  renderResults(results, found);
  status.textContent = `Знайдено: ${found.length}`;
}
```

**Коміт:** [`a6a9489`](https://github.com/HunterDead14/Web_React/commit/a6a9489b6a4953f197919b01874b22582fed36e8).

![Рис. 5.5.1. До виправлення: форма Одеса, список Київ](zvit-img/5-5-before-race.png)

### C.2. Два обробники кліку

Код вставив у Console на HEAD: два слухачі на одній кнопці, у першому `setTimeout` і `Promise.then`, у другому `queueMicrotask`.

| Випадок | Мій прогноз | Прогноз AI | Фактичний результат |
|---|---|---|---|
| (а) клік мишею | listener 1, listener 2, promise 1, microtask 2, timeout 1 | те саме | **listener 1, promise 1, listener 2, microtask 2, timeout 1** |
| (б) `btn.click()` + `console.log` | listener 1, listener 2, after click(), promise 1, microtask 2, timeout 1 | те саме | **збіглося з прогнозом** |

У випадку (а) я помилився, і AI теж. Після першого listener стек порожній, тому браузер виконує microtask checkpoint до другого listener. У випадку (б) `btn.click()` викликаний з Console, стек не порожній, тому checkpoint не відбувається.

---

## 5. Регресійна перевірка (§5.6)

Прогін на 800 і 1280 px, HeadlessChrome через CDP. Кліки були справжні (`Input.dispatchMouseEvent`).

| Поведінка за ТЗ | HEAD (до) | Після виправлень |
|---|---|---|
| 3.1 Меню на 800 px відкривається | Не відкривається, `aria-expanded` не змінюється | Відкривається й закривається |
| 3.3 Львів + Усі види | TypeError, статус 6 | 3 картки, статус 3 |
| 3.3 Одеса + Усі види | Статус 6 | 2 картки, статус 2 |
| 3.3 Усі міста | TypeError, 6 старих карток | 12 карток |
| 3.3 Останній пошук перемагає | На екрані Київ | На екрані Одеса (2) |
| 3.5 Підтвердити бронювання | ReferenceError, діалог не закривається | Закривається, лічильник 1 |
| 3.6 Мої бронювання | Список порожній через помилку | 1 бронювання, після reload — 0 |
| 3.7 Console | 3 винятки | 0 винятків і попереджень |

Регресія знайшла ще один дефект, якого не було в A–C. Селектор `.site-header button` повертав першу кнопку в header, тобто кнопку бронювань, а не кнопку меню. Виправлення — [`d4e30c8`](https://github.com/HunterDead14/Web_React/commit/d4e30c85467127da2accf032cf0e7ec7e8c3079c): `querySelector('.menu-toggle')`.

Усі коміти:

| Сценарій | Причина | Коміт |
|---|---|---|
| A | `pricePerhour` замість `pricePerHour` | [`39c0965`](https://github.com/HunterDead14/Web_React/commit/39c0965113f6f9fdf202f662826dec1eca7c2daa) |
| A2 | Неіснуюча `renderBookingsCount` | [`c3ccb88`](https://github.com/HunterDead14/Web_React/commit/c3ccb88c3e4a166a305c99d9c62d595462e675a0) |
| B | Слухачі зникали після `innerHTML` | [`8a1804e`](https://github.com/HunterDead14/Web_React/commit/8a1804efa2012087b9283e7fd1d77479e8ffbdbb) |
| C | Гонка відповідей | [`a6a9489`](https://github.com/HunterDead14/Web_React/commit/a6a9489b6a4953f197919b01874b22582fed36e8) |
| §3.1 | Неправильний селектор меню | [`d4e30c8`](https://github.com/HunterDead14/Web_React/commit/d4e30c85467127da2accf032cf0e7ec7e8c3079c) |

---

## 6. Підсумок

**Де AI справді скоротив час.** У сценарії A агент швидко запропонував перевірку регістру ключа, і це дало першу гіпотезу, яку я підтвердив. У B він підказав делегування, а в C — токен запиту замість `setTimeout`. Шаблон перевірок (3 картки Львова, 2 Одеси, чиста Console) теж був корисний.

**Де відповідь потребувала перевірки в DevTools.** Гіпотезу «ціни немає або `null`» (A) відкинув лише `Object.keys`. Гіпотезу про `data-id` (B) — `dataset.id`. Прогноз AI щодо порядку microtasks у C.2 був неправильним, і це видно тільки в Console. AI також стверджував наявність `(async)` у стеку, а скріншот показав інакше.

**Приклад пропозиції, яка замаскувала б першопричину.** Гіпотеза AI «ціни немає або вона `null`» привела б до правки у `formatPrice`: `venue.pricePerHour ?? 0` або `value?.toLocaleString()`. Помилка зникла б з Console, але картка показувала б `0 грн` замість `1 200 грн`, а неправильний ключ у `venues.json` залишився б. Тому я виправив саме дані.

**Чи AI одразу знаходив першопричину?** Ні. Він спочатку дав кілька гіпотез, тому я не просив «виправити лише `format.js`». Це варто було б зробити окремим експериментом.

**Обмеження.** Перевірка на HeadlessChrome і двох ширинах; інші браузери й екранні диктори не тестував. Для нової картки в HEAD немає окремого скріншота `getEventListeners`, перевірено через CDP і поведінку. Lint і typecheck не запускав, бо змінювався лише звіт.
