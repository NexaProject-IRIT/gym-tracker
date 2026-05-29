# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the project

Everything runs through Docker Compose from the repo root:

```bash
docker compose up --build        # first run or after dependency changes
docker compose up                # subsequent runs
docker compose down
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432

For local backend development without Docker (requires a running Postgres):

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py sync_knowledge_base   # loads exercises/equipment from knowledge_base/
python manage.py runserver
```

For local frontend development:

```bash
cd frontend
npm install
npm run dev      # dev server with HMR at localhost:5173
npm run build    # TypeScript compile + Vite bundle
npm run lint     # ESLint
```

## Running tests

Backend tests use pytest with an in-memory SQLite DB and mock LLM (no real keys needed):

```bash
cd backend
pytest --tb=short          # run all tests
pytest tests/test_api.py   # run a specific file
```

Test settings live in `gym_tracker/test_settings.py` (overrides DB to SQLite, sets `LLM_PROVIDER=mock`). Fixtures and session setup are in `conftest.py`.

## Architecture overview

**Stack:** Django REST Framework backend + React (Vite + TypeScript + Tailwind) frontend.

The frontend proxies API calls to the backend via Vite's `server.proxy` config — all fetch calls use relative paths (e.g., `/workouts/`, `/auth/`). In Docker, proxy target is `http://backend:8000`.

**Authentication:** JWT-based (`rest_framework_simplejwt`). On login/register the backend returns `access` + `refresh` tokens, stored as `token` and `refresh_token` in `localStorage`. Every request adds `Authorization: Bearer <access>`. When a request returns 401, `utils/api.ts` silently calls `/auth/token/refresh/` (singleton promise prevents races), retries once, then redirects to `/login` and clears storage. `PrivateRoute` in `App.tsx` guards all non-auth pages; it redirects unauthenticated users to `/welcome`.

**Backend apps:**

| App | Responsibility |
|---|---|
| `profiles` | User registration/login, `UserProfile` (height, weight, goal). Profile is auto-created via `post_save` signal on `User`. |
| `exercises` | `Exercise`, `ExerciseParameter`, `Equipment` models. Read-only from the frontend — populated by `sync_knowledge_base`. |
| `workouts` | `Workout` + `WorkoutExercise` models, full CRUD per user. |
| `ai` | AI trainer chat. Stores `ChatMessage` per user, calls GigaChat API, parses `<workout>` / `<import>` XML tags from LLM responses. |

**Knowledge base sync flow:** Exercises and equipment are defined as Markdown files with YAML frontmatter in `backend/knowledge_base/exercises/` and `backend/knowledge_base/equipment/`. On startup (and via `python manage.py sync_knowledge_base`), `exercises/services/md_parser.py` parses the frontmatter and `exercises/services/exercise_sync.py` upserts records into the DB. Images are copied from `knowledge_base/images/` to `media/knowledge_base/` and served via Django's `MEDIA_URL`.

**Exercise frontmatter schema:**
```yaml
type: exercise
id: barbell-squat          # unique slug, used as exercise_id in DB
name: Приседания со штангой
equipment: Штанга           # must match an existing Equipment name
targetMuscles: [...]
tags: [...]
difficulty: beginner | intermediate | advanced
parameters: [sets, reps, weight]   # controls which fields are shown in the UI
images:
  cover: images/exercises/...
  technique: [images/exercises/..., ...]
  muscleMap: images/exercises/...
description: >
  ...
```

**Frontend routes** (all behind `PrivateRoute` except `/welcome`, `/login`, `/register`):

| Path | Component |
|---|---|
| `/welcome` | `LandingPage` (public) |
| `/` | `HomePage` |
| `/workouts` | `WorkoutList` |
| `/workouts/:id` | `WorkoutDetailPage` |
| `/knowledge` | `ExerciseGrid` |
| `/ai` | `AiChatPage` |
| `/profile` | `ProfilePage` |
| `/settings` | redirect → `/profile` |

**Frontend state management:** Four context providers wrap the app:

- `ThemeContext` (`src/contexts/ThemeContext.tsx`) — dark/light theme, persisted to `localStorage` as `theme`, applied via `data-theme` on `<html>`. Wraps the app root in `App.tsx`.
- `TimerContext` (`src/contexts/TimerContext.tsx`) — floating timer state. Wraps the app root in `App.tsx` so the timer persists across route changes.
- `WorkoutsContext` (`src/contexts/WorkoutsContext.tsx`) — wraps `useWorkoutsApi` hook and exposes it app-wide. Components call `useWorkoutsContext()` to get `workouts`, `fetchWorkoutDetail(id)`, and CRUD functions. The list endpoint returns workouts without exercises; exercises are fetched on demand. **Provided in `MainLayout.tsx`**, not `App.tsx`.
- `AiChatContext` (`src/contexts/AiChatContext.tsx`) — wraps `useAiChat` hook. Also provided in `MainLayout.tsx`.

**`WorkoutExercise.parameters` field:** A critical field — a `string[]` of active parameter keys (e.g. `['sets', 'reps', 'weight']`). This field must be persisted to the backend; without it the UI cannot know which input fields to render for an exercise. Legacy records without this field are handled by `inferParameters()` in `useWorkoutsApi.ts`. Per-type defaults live in `DEFAULT_PARAMS_FOR_TYPE` in `src/types/workout.ts`.

**`Workout.date` field:** A `DateField` (date only, no time). The AI import and bulk-import flow set this from LLM-parsed data.

**API routes:**

| Path | App |
|---|---|
| `/auth/` | `profiles.urls` |
| `/exercises/` | `exercises.urls` |
| `/workouts/` | `workouts.urls` (ViewSet CRUD) |
| `/workouts/bulk-import/` | `workouts.views.BulkImportView` (POST — creates multiple workouts, used by AI import) |
| `/export/` | `workouts.views.ExportWorkoutsView` |
| `/ai/chat/` | `ai.views.ChatView` (POST) |
| `/ai/history/` | `ai.views.HistoryView` (GET / DELETE) |

**AI trainer (GigaChat):** The `ai` app calls the GigaChat (Sber) LLM. Controlled by env vars in `docker-compose.yml`:

- `LLM_PROVIDER` — `gigachat` (default) or `mock` (no real key needed, returns hardcoded responses)
- `GIGACHAT_AUTH_KEY` — Base64-encoded OAuth key
- `GIGACHAT_SCOPE` — `GIGACHAT_API_PERS` (default)
- `GIGACHAT_MODEL` — `GigaChat` (default)
- `GIGACHAT_VERIFY_SSL` — `false` (GigaChat uses Mintsifrry root CA not in default bundles)

To develop the AI tab without a real key, set `LLM_PROVIDER=mock` in `docker-compose.yml`. `MockLLMClient` returns a `<workout>` block if the message contains "составь тренировку", otherwise a plain help text.

The LLM response may contain `<workout>{...}</workout>` (single workout suggestion) or `<import><workout>...</workout>...</import>` (bulk import). These are parsed by `ai/services/workout_parser.py` before the message is saved.

## Team

- Danila (me) — lead, devops, workouts/timer tabs, AI trainer (sprint 5)
- Danil (backend) — Django backend, all API endpoints
- Vlad (parser) — md parser, exercise sync, images
- Nika (frontend) — profile, settings, layout, registration, landing
- Dasha (frontend) — knowledge base tab, ExerciseGrid

---

## Sprint history & task breakdown

### Sprint 1 (deadline: 22.03.2026)

**Danila:** Верстка трёх экранов (таймер, список тренировок), аналитика конкурентов, базовый бэкенд (отдача списка упражнений). DevOps. Создал пустые файлы `routes/exercises.py` и `routes/workouts.py` для Данила.

**Ника:** Изучила аналоги (Liftosaur, GymNotePlus, DU-Training), гугл-таблица сравнения фич. Аргументация чем лучше (Active Mode — ИИ-советы перед подходом). Верстка `MainLayout.tsx` (шапка + боковое меню).

**Даша:** Вкладка "База знаний" — сетка карточек упражнений, разделение на 2 вкладки ("Все" и "Тренажёры"). Данные из `mockExercises.json`.

**Влад:** Скрипт на Python — парсинг `.md` файлов (название, теги, описание) → `exercises.json` для автозагрузки в БД.

**Данил:** Базовые GET-эндпоинты в `routes/exercises.py` и `routes/workouts.py` (список упражнений, список тренировок). Pydantic-схемы 1-в-1 с TypeScript-интерфейсами.

**Итог спринта (22.03):** Ника — аналитика 10/10. Данил — бэкенд заведён, GET работают; переходим на Django REST Framework. Даша — верстка без Docker. Danila — таймер и список тренировок готовы.

---

### Sprint 2 (deadline: 29.03.2026)

**Danila:** Слияние веток бэка и фронта в main, проверка `docker compose up`. Написал логику JWT-токена на фронте (хранение, refresh). Реальные HTTP-запросы в модуле тренировок (данные в PostgreSQL). Рефакторинг, подготовка к ИИ.

**Ника:** `MainLayout` с React Router (в `App.tsx` только вызов лейаута). Лендинг / HomePage. Страницы-заглушки Настройки и Личный кабинет.

**Даша:** База знаний: сетка карточек + поиск + хэштеги + разделение на вкладки. Детальная страница упражнения (SVG). Подключение к реальному API `GET /exercises/` (try/catch, спиннер).

**Влад:** Переписал парсер — переход от JSON к автозагрузке в БД. Полное тестирование API бэкенда.

**Данил:** CORS (`django-cors-headers`). Модели ORM: `Exercise`, `Workout` (по ТЗ). API: `GET /exercises/`, CRUD `/workouts/`. Перешёл на Django REST Framework. Обновил `Dockerfile` и `requirements.txt`.

**Итог спринта (30.03):** Ника — Layout, лендинг, заглушки профиля/настроек. Даша — база знаний: поиск, теги, вкладки. Данил — все баги бэкенда пофикшены, API и Swagger работают. Влад — парсер + тестирование API. Danila — координация, рефакторинг, подготовка веток к слиянию.

---

### Sprint 3 (deadline: 06.04.2026 approx)

**Danila:** Слил ветки бэка и фронта в main. JWT на фронте. HTTP-запросы тренировок → PostgreSQL. Почва для ИИ-аналитики.

**Ника:** Мобильный багфикс NavBar (боковое меню → нижняя панель с иконками на мобилке). Формы Регистрации (`Логин, Пароль, Повтор пароля` → `Рост, Вес`) и Авторизации с базовой валидацией. ProfilePage: поля `Имя, Возраст, Вес, Рост` редактируются (кнопка "Редактировать" → "Сохранить").

**Даша:** Вкладка "Все упражнения" — карточки с фото техники. Вкладка "Тренажёры" — фото тренажёра, клик → фильтр упражнений. Подключение к реальному API (try/catch).

**Влад:** Функция `generate_export_text(workouts_data)` → форматированная `.txt` строка. Формат: `*название* *дата* *тип*`, затем каждое упражнение с падежами. Данил вызывает её в `/export/`.

**Данил:** Переход на Django. User + `UserProfile` (рост, вес, возраст). `Workout → ForeignKey(User)`. Эндпоинты: `POST /auth/register/`, `POST /auth/login/`, `GET /exercises/`, `GET/POST /workouts/`, `GET /export/`.

---

### Sprint 4 (deadline: 27.04.2026)

**Danila:** Слил ветки, подлатал косяки (описание не приходило с бэка, кривые пути к картинкам). Картинки копируются в `MEDIA_ROOT` при синке, раздаются через `/media/`. Апнул Python в Dockerfile, починил urls. Спринт 5 — ИИ-тренер (ветка `ai`): Django-приложение `ai/`, `POST /ai/chat/`, интеграция с GigaChat, `AiChatPage`.

**Ника:**
- Убрала "Серию дней" из ProfilePage (grid 3→2 колонки).
- Поле "Цель" в регистрации (радиокнопки/карточки) и профиле (select в режиме редактирования): `lose_weight | gain_muscle | recomposition | improve_endurance | increase_strength | maintain`.
- Статистика в ProfilePage: `GET /workouts/stats/` → "Тренировок" (с падежами) + "Этот месяц".
- Кнопка "Очистить историю" с confirm-модалкой → `DELETE /workouts/clear/` → обновить счётчики.
- Компонент `NumberInput` (`src/components/UI/NumberInput.tsx`) с кнопками ± (шаги: weight 0.5, height 1, age 1). Заменила `input type="number"` в ProfilePage и RegisterPage.
- Заменила эмодзи 👤 → SVG в ProfilePage.

**Даша:**
- Переименовала "База знаний" → "База тренировок" везде (ExerciseGrid, NAV_ITEMS).
- ExerciseGrid → API: `GET /exercises/` при загрузке (спиннер, try/catch). Вкладка "Тренажёры" → `GET /equipment/`. Клик по тренажёру → фильтр упражнений на фронте.
- SVG-лупа вместо 🔍.
- Проверила сохранение `notes` в WorkoutDetail (PUT передаёт `notes`, view-режим отображает).

**Данил:**
- Поле `goal` в `UserProfile` + API (валидация).
- Имя: `first_name` вместо `username` в `UserSerializer`.
- `GET /workouts/stats/` → `{ total, this_month }`.
- `DELETE /workouts/clear/` → 204.
- `notes` в `ExportWorkoutsView` + `generate_export_text()`.
- Модель `Equipment` (uid, name, description, tags JSONField, image, source_file) + `GET /equipment/`.

**Влад:**
- Переписал `md_parser.py` под YAML frontmatter (`python-frontmatter`). Читает `type` из frontmatter — `equipment` или `exercise`. `parse_knowledge_base()` парсит `knowledge_base/equipment/` и `knowledge_base/exercises/`.
- Переписал `exercise_sync.py`: сначала Equipment, потом Exercise (проверка соответствия поля `equipment`). Синхронизация `ExerciseParameter` из `parameters`. `images` → dict `{cover, technique, muscleMap}`.
- Команда `python manage.py sync_knowledge_base` — обе папки, статистика.
- Создал `.md`-файлы: 8 тренажёров в `knowledge_base/equipment/`, 27 упражнений в `knowledge_base/exercises/`.

---

### Sprint 5 (deadline: 27.04.2026 — ИИ + полировка)

**Danila:** Полностью взял ИИ-тренера (бэк + фронт) — задачи 4.1 и 4.2. Ветка `ai`. `ai/` Django-приложение, `POST /ai/chat/`, интеграция GigaChat, `AiChatPage` (мессенджер-стиль), парсинг `<workout>...</workout>` и `<import>`, кнопка "Добавить тренировку".

**Ника:**
- Autocomplete в `WorkoutForm.tsx`: `GET /exercises/search/?q=...`, debounce 300ms, выпадающий список, при выборе — `exerciseId`, `isCustom=false`, автоподстановка `parameters`.
- Иконка (i) в `WorkoutDetail.tsx` у упражнений с `exerciseId` → модалка с деталями (переиспользует `ExerciseDetailsModal`).
- `NumberInput.tsx`: скрыть браузерные стрелки (`-webkit-appearance: none`, `-moz-appearance: textfield`).
- Убрала все оставшиеся эмодзи (RegisterPage, WorkoutList, WorkoutForm, SettingsPage). SVG: stroke-based, strokeWidth=1.8, currentColor/#6ee7b7.
- Редизайн `HomePage.tsx`: hero-блок + кнопка "Начать", 3 карточки функций, "Как начать" (3 шага), промо-блок. Тёмная тема (#6ee7b7, #111318, #1a1d24).

**Даша:**
- Нечёткий поиск: при заполненной строке → `GET /exercises/search/?q=...` с debounce 300ms; при пустой → `GET /exercises/`. Спиннер, try/catch.
- Серверная фильтрация по тегам: `GET /exercises/?tag=ноги` вместо локальной фильтрации через useMemo.
- `muscleMap` в модалке: блок "Целевые мышцы (карта)", по центру, max-width 400px, между "Техника" и тегами. Если поле пустое — не рендерим.
- Рефакторинг `ExerciseGrid.tsx` (300+ строк → подкомпоненты): `ExerciseCard`, `EquipmentCard`, `ExerciseModal`, `SearchBar`, `TagFilter` в `src/components/KnowledgeBase/`.

**Данил:**
- Нечёткий поиск `GET /exercises/search/?q=...` с `rapidfuzz` (score > 60, limit 20). Ответ: `id`, `name`, `parameters`, `targetMuscles`.
- Удалил мёртвые `ExerciseViewSet` и `EquipmentViewSet` из `exercises/views.py`. Убрал дублированный `collectstatic` из `docker-compose.yml`.
- Поле `created_date` в `UserProfile` (если не было `created_at auto_now_add`).

**Влад:**
- Залил фото для всех 8 тренажёров и 27 упражнений в `knowledge_base/images/` (имена строго как в `.md`: `barbell-squat-cover.jpg`, `barbell-squat-step1.jpg`, `barbell-squat-muscles.svg`).
- Graceful skip в `md_parser.py` для `.md` без поля `type`: лог "malformed frontmatter in X.md".
- Расширил базу на 10-15 упражнений (гиря, турник, брусья, гантель-разводка, тяга верхнего блока, сведения в тренажёре).

---

### Sprint 6 — Наполнение базы (25.05.2026)

Задача: добавить ~80 новых упражнений в формате YAML frontmatter (`.md`). Всё строго по существующему шаблону, чтобы парсер не ломался.

**Даша:**
- Силовые: Отжимания от пола, Тяга верхнего блока, Гиперэкстензия, Выпады, Ягодичный мостик (Hip Thrust), Сведение/Разведение ног, Махи гантелями в стороны, Разгибание рук на верхнем блоке, Разгибание руки с гантелью в наклоне, Скручивания (кранчи).
- Кардио: Ходьба (беговая дорожка), Эллиптический тренажер (Орбитрек).
- Гибкость/Мобильность: МФР (массажный ролл), Собака мордой вниз/вверх, Кошка-Корова, Поза ребёнка, Поза голубя, Мостик, Складка, Бабочка, Выпады бегуна, Скручивания позвоночника.

**Ника:**
- Силовые: Пуловер с гантелью, Подтягивания в гравитроне, Пуллловер на верхнем блоке, Приседания в тренажёре Смита, Сгибание ног (сидя/лёжа), Подъём на носки, Махи гантелями перед собой, Тяга штанги к подбородку, Обратные отжимания от скамьи, Русская скрутка, Ролик для пресса.
- Функциональный тренинг: Бёрпи, Махи гирей, Запрыгивания на тумбу, Работа с боевыми канатами, Лазание по канату.
- Кардио/Баланс: Степпер (StairMaster), Лыжный тренажер (SkiErg), Прыжки на скакалке, Поза воина, Планка.

**Данил:**
- Силовые: Жим штанги лёжа, Жим гантелей лёжа, Сведение рук Пек-дек, Подтягивания (широкий/узкий/обратный), Тяга гантели в наклоне, Т-тяга, Приседания со штангой, Гакк-приседания, Армейский жим, Обратная бабочка, Подъём штанги на бицепс, Сгибания на скамье Скотта, Подъём ног в висе.
- Функциональный/Кардио: Рывок штанги/гири, Взятие на грудь (Clean), Толкание/Тяга саней, Выходы силой, Гребля, Бокс.

**Влад:**
- Силовые: Жим на наклонной скамье, Сведение рук в кроссовере, Отжимания на брусьях с весом, Тяга штанги в наклоне, Тяга нижнего блока, Рычажная тяга (Хаммер), Жим ногами, Румынская/Мёртвая тяга, Разгибание ног сидя, Жим гантелей сидя (Арнольда), Махи в наклоне на заднюю дельту, Молот/Подъём с супинацией, Французский жим, Скручивания в тренажёре.
- Функциональный/Кардио: Трастеры, Толчок (Jerk), Wall Balls, Прогулка фермера, Бег, Велосипед (велотренажер), Плавание.

Требования: фотографии для каждого упражнения (найти готовые или подобрать в стиле уже существующих). Все файлы строго по существующему шаблону frontmatter.

---

## Security audit (completed ~май 2026)

| # | Уровень | Проблема | Состояние |
|---|---|---|---|
| S-1 | 🔴 КРИТИЧНО | Ключ GigaChat закоммичен в git | не надо (учебный проект) |
| S-2 | 🔴 КРИТИЧНО | POST/PUT/DELETE /exercises/ без авторизации | **сделано** |
| S-3 | 🔴 КРИТИЧНО | `SECRET_KEY = 'django-insecure-...'` | не надо |
| S-4 | 🔴 КРИТИЧНО | `DEBUG=True` + `ALLOWED_HOSTS=['*']` | **сделано** |
| S-5 | 🔴 КРИТИЧНО | `CORS_ALLOW_ALL_ORIGINS=True` + `CORS_ALLOW_CREDENTIALS=True` | **сделано** |
| S-6 | 🔴 КРИТИЧНО | Пароль БД в открытом виде в docker-compose | не надо |
| S-7 | 🟠 ВЫСОКИЙ | Нет rate limiting на /auth/login/ и /auth/register/ | **сделано** |
| S-8 | 🟠 ВЫСОКИЙ | Токены никогда не истекают (→ simplejwt) | **сделано** |
| S-9 | 🟠 ВЫСОКИЙ | LogoutView падает с 500 без токена | **сделано** |
| S-10 | 🟡 СРЕДНИЙ | Токен в localStorage (XSS) | не надо (MVP) |
| S-11 | 🟡 СРЕДНИЙ | Django Admin без доп. защиты | не надо |
| S-12 | 🟡 СРЕДНИЙ | `GIGACHAT_VERIFY_SSL=false` (MitM) | не надо (демо) |
| S-13 | 🟢 НИЗКИЙ | Слабая политика паролей | **сделано** |
| S-14 | 🟢 НИЗКИЙ | Нет сброса пароля | не надо |
| S-15 | 🟢 НИЗКИЙ | Нет верификации email | не надо |

---

## Bug audit (completed ~май 2026)

| # | Компонент | Описание | Состояние |
|---|---|---|---|
| B-1 | WorkoutDetail/Serializer | `is_done` сбрасывался при PUT (пересоздание упражнений) | **сделано** |
| B-2 | exercises/views.py | `ExerciseCreateSerializer` импортировался но не использовался в POST | **сделано** |
| B-3 | workouts/views.py | `BulkImportView` сохранял date в DateTimeField → сдвиг даты | **сделано** |
| B-4 | WorkoutDetail.tsx | Дата сдвигалась на день назад из-за `toISOString()` + timezone | **сделано** |
| B-5 | useWorkoutsApi/Context | Два отдельных экземпляра хука (нет общего кэша) | **сделано** |
| B-6 | WorkoutForm.tsx | `notes` никогда не сохранялся (useState без сеттера) | **сделано** |
| B-7 | WorkoutForm.tsx | При создании всегда ставилась текущая дата | **сделано** |
| B-8 | workouts/views.py | `exercise_done`: параметр `pk=None` при `lookup_field='uid'` | **сделано** |
| B-9 | workouts/views.py | `deleted_count` вычислялся но не возвращался | **сделано** |
| B-10 | App.tsx/MainLayout.tsx | Google Fonts подключался дважды | **сделано** |
| B-11 | WorkoutList.tsx | `notes` не отображался на карточках | **сделано** |
| B-12 | exercises/views.py | Фильтрация по тегу чувствительна к регистру | **сделано** |
| B-13 | useAiChat/WorkoutList | После добавления тренировки из ИИ список не обновлялся | **сделано** |
| B-14 | types/workout.ts | Дублирование: `note` и `notes` в `WorkoutExercise` | **сделано** |
| B-15 | knowledge_base/ | 3 `.md` файла в корне вместо `exercises/` (игнорировались) | **сделано** |

---

## Code quality audit (completed ~май 2026)

| # | Тип | Описание | Состояние |
|---|---|---|---|
| C-1 | 💀 Мёртвый код | `useWorkouts.ts` — 130 строк, заменён на `useWorkoutsApi.ts` | **сделано** |
| C-2 | 💀 Мёртвый код | `TimerComponent.tsx` — 357 строк, заменён FloatingTimer+TimerContext | **сделано** |
| C-3 | 💀 Мёртвый код | `SettingsPage.tsx` — дублирует инлайн-редирект в App.tsx | **сделано** |
| C-4 | 💀 Мёртвый код | `backend/init_test_db.py` — одноразовый скрипт | **сделано** |
| C-5 | 📏 Большой файл | `WorkoutDetail.tsx` — 764 строки → разбит на подкомпоненты | **сделано** |
| C-6 | 📏 Большой файл | `WorkoutForm.tsx` — 502 строки → подкомпоненты | **сделано** |
| C-7 | 📏 Большой файл | `WorkoutList.tsx` — 369 строк → WorkoutCard, WorkoutMenu, StatsRow | **сделано** |
| C-8 | 📏 Большой файл | `ProfilePage.tsx` — 410 строк → PersonalDataCard, DataActionsCard, ConfirmModal | **сделано** |
| C-9 | 🔄 Дублирование | `getToken()/authHeaders()` в 5+ файлах → `src/lib/api.ts` с `apiFetch()` | **сделано** |
| C-10 | 🔄 Дублирование | `Field/SmallField/TimeField` в трёх местах → `src/components/UI/` | **сделано** |
| C-11 | 🔄 Дублирование | `WORKOUT_TYPE_ICONS` в двух файлах → `src/constants/workoutTypes.ts` | **сделано** |
| C-12 | 🎨 Токены дизайна | Цвета захардкожены в 30+ файлах → `src/constants/theme.ts` | **сделано** |
| C-13 | ⚠️ TypeScript any | `any` в 6 местах → конкретные типы + `noImplicitAny` в tsconfig | **сделано** |
| C-14 | ⚡ Конфликт стилей | Tailwind установлен но не используется (живые компоненты — inline) → удалён | **сделано** |
| C-15 | 🧪 Нет тестов | Нулевое покрытие → написаны pytest-тесты (регистрация, логин, тренировки, AI chat mock) | **сделано** |

