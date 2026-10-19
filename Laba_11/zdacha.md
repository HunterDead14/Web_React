# ЛР №11 — лист зі звітом (дослідженська частина)

> Це готовий текст для листа викладачу. Після виконання практичної частини (§5) сюди треба
> додати: результат `check.html`, чек-лист Network N1–N6 зі скриншотами й підсумок роботи
> (ТЗ, §6, пп. 4–6).

**Тема:** [Веб] ЛР-11: AI-агент для інтеграції REST API

| | |
| --- | --- |
| GitHub repository | <https://github.com/HunterDead14/Web_React> (тека `Laba_11/`) |
| GitHub Pages | <https://hunterdead14.github.io/Web_React/Laba_11/> |
| Самоперевірка | <https://hunterdead14.github.io/Web_React/Laba_11/check.html> |
| Конспект API | [`Laba_11/API.md`](./API.md) — §4.5 |
| Правила для агента | `Laba_11/AGENTS.md` — ТЗ, §4 (перед Challenge 3) |
| Повний конспект дослідження | [`Laba_11/doslidennia.md`](./doslidennia.md) — §4.1–4.4, §4.6 |
| AI-агент | OpenCode (Kodeo/OpenCode CLI), режим агента з редагуванням файлів |
| Модель | `minimax-m3.1-flash-free` (провайдер `opencode`) |
| Дата роботи | 19.10.2026 |

---

## 1. Таблиця експериментів §4 (усі 13)

> Повністю — з кодом, дослівним виводом Console і доказами з панелі Network — у
> [`doslidennia.md`](./doslidennia.md). Низи — скорочена версія для листа.

| # | Що досліджено | Мій аналіз | Фактичний результат (Console і Network) | Пояснення (якщо не збіглося) |
| --- | --- | --- | --- | --- |
| 1 | fetch і статус 404 | `fetch` не відхиляє проміс на HTTP-статусах: він знає лише «мережа працює / не працює». Статус — число в `Response`, а не помилка JS. | Console: `false 404`, `{name:'Not Found', message:'', code:0, status:404}`. Network: `GET /shows/999999999` → **404**, 276 мс | У Console **є** червоний рядок (`Failed to load resource: … 404`) — але він від браузера, не від коду. Код відпрацював штатно |
| 2 | Тіло читається один раз; HTML замість JSON | Тіло — одноразовий потік; друге читання — помилка стану об'єкта. HTML з JSON-парсером дає іншу помилку | Console: `Game of Thrones`; `вдруге: TypeError \| body stream already read`; `HTML: SyntaxError Unexpected token '<'` (тіло `text/html`, 200) | `id=82` — це **Game of Thrones**, а не «The Cosby Show». Текст TypeError у Chrome 152: `body stream already read` |
| 3 | forEach, for…of і Promise.all | `forEach` не чекає на проміси; `for…of` — послідовно, `Promise.all` — паралельно | Console: `forEach: 0` → `через 2 с: 3`; `for…of: 208 мс`; `Promise.all: 155 мс`. Waterfall: forEach — старт 0/1/1 мс, for…of — 2003→2093→2143 мс, Promise.all — 2212/2212/2212 мс | Прогноз «≈3×» не підтвердився: фактично ≈1,3×. Причина — мала затримка й warm-з'єднання. **Структурно** Waterfall доводить поспіль проти паралельно |
| 4 | `return` і `return await` у try | `try/catch` ловить синхронні винятки; `return fetch(url)` завершує `try` до відхилення, тому помилка проходить мимо | Console: `поза load: TypeError`; з `return await` → `catch у load: TypeError` і `null`. Network: 2 запити до `.invalid` → failed | У нашому середовищі браузер через проксі-тунель: `ERR_TUNNEL_CONNECTION_FAILED`; у звичайному браузері — `ERR_NAME_NOT_RESOLVED`. Для JS це одна помилка: `TypeError` / `Failed to fetch` |
| 5 | Promise.all і Promise.allSettled | `all` відхиляється на першій помилці й відкидає решту; `allSettled` не відхиляється ніколи | Console: `all: TypeError \| Failed to fetch`; `allSettled: ["fulfilled","rejected","fulfilled"]`; fulfilled → 200, 200. Network: у фазі `all` обидва успішні запити є (200, 200) — але результату немає | Розбіжностей немає |
| 6 | AbortController | Скасування — не помилка; після заголовків `status` лишається дійсним, але тіло вже не прочитається | Console: `до відповіді: AbortError`; `після відповіді: 200 \| ok: true`; `json(): AbortError`. Network: `net::ERR_ABORTED`, у DevTools — `(canceled)` | Розбіжностей немає |
| 7 | Заголовки відповіді | Скрипт бачить лише CORS-safelisted заголовки; `Date`, `Server`, `Retry-After` приховані | Console: `content-type: application/json; charset=UTF-8`; `cache-control: public, max-age=3600`; `date: null`; `server: null`; `retry-after: null`; ключів **2**. DevTools бачить `date`, `server: nginx/1.24.0` | Скрипт бачить 2 заголовки, а не 3: `content-length` немає — TVmaze віддає `transfer-encoding: chunked` + `content-encoding: gzip` |
| 8 | HTTP-кеш | `max-age=3600` → кеш браузера; `no-store` не читає і не зберігає | Console: `1: 159 мс`, `2: 6 мс` (кеш), `3 no-store: 57 мс`, `4: 6 мс` (кеш). Network: 156 → 4 → 54 → 4 мс | `no-store` **не перезаписує** вже збережену відповідь — тому 4-й запит знову з кешу |
| 9 | Переадресація | `fetch` сам іде за переадресацією; 301 бачить браузер, не скрипт | Console: `200 true https://api.tvmaze.com/shows/82`, `Game of Thrones`. Network: `GET /lookup/shows?imdb=tt0944947` → **301**, далі `GET /shows/82` → **200** | IMDb-id `tt0944947` → Game of Thrones, TVmaze-id **82** |
| 10 | Рядок запиту | `&` — роздільник параметрів, тож без кодування значення розривається | Console: `Law  Array(2)`; `Law & Order ?q=Law+%26+Order`; raw plain `?q=Law%20&%20Order` | Розбіжностей немає |
| 11 | Два домени TVmaze | `api.` і `www.` — різні origin. CORS блокує **читання** відповіді, а не надсилання | Console: `api: 200`; CORS-помилка `No 'Access-Control-Allow-Origin' header is present`; `www: TypeError Failed to fetch`. Network: рядок `GET www.tvmaze.com/shows/82` є, `failed / net::ERR_FAILED` | Запит **дійшов**, відповідь **прийшла** — інакше браузер не зміг би сказати «немає ACAO». Заблоковано доступ скрипта до тіла |
| 12 | Preflight | `Content-Type: application/json` не safelisted → браузер шле `OPTIONS`; TVmaze на `OPTIONS` → 405 без CORS-заголовків | Console: CORS-помилка `Response to preflight request doesn't pass access control check`; `Content-Type: TypeError Failed to fetch`; `Accept: 200`. Network: `GET` → failed, `OPTIONS` → **405**, `GET` → **200** | На перший запит два рядки: `OPTIONS 405` і провалений `GET`; сам `GET` не дійшов. «All endpoints are CORS enabled» = дозволені **прості** запити |
| 13 | `mode: 'no-cors'` | Не «виправляє» CORS, а посилює обмеження: відповідь стає opaque | Console: `opaque 0 false`; тіло `""`. Network: `GET www.tvmaze.com/shows/82` → **301**, далі → `ERR_ABORTED` | Розбіжностей немає: тіло — порожній рядок, без помилки |

---

## 2. Конспект API (§4.5)

Покладено в репозиторій: **[`Laba_11/API.md`](./API.md)** — таблиця «Питання → Що каже документація →
Що показав запит (адреса)» за всіма десятьма пунктами завдання. Кожен рядок перевірено справжнім
`GET`-запитом до `https://api.tvmaze.com`.

---

## 3. Правила для агента (ТЗ, §4)

Файл `Laba_11/AGENTS.md` буде додано **перед Challenge 3** — окремим комітом `Agent rules`
(до 40 рядків). Його зміст: контракт TVmaze з `API.md` (ендпоїнти, форма відповідей, статуси,
ліміт, CORS) і правила проєкту, знайдені під час аудиту C1–C2.

---

## 4–6. Практична частина, чек-лист Network і підсумок

> Доповнюється після виконання §5. Сюди переноситься: «Пройдено: N з 24» із `check.html`
> на опублікованій сторінці, чек-лист N1–N6 зі скриншотами та підсумок — що зроблено в
> кожному challenge і що виправлено в чернетках AI.

<!-- ЗАПОВНИТИ ПІСЛЯ §5 -->
