# План разработки Daylist

## ✅ Этап 1. Инфраструктура и окружение разработки

Настраиваем всё необходимое для локальной разработки до написания первой строки бизнес-логики.

**Задачи:**

1. ✅ Переименовать `apps/web` → `apps/landing`; создать `apps/app` на Vite + React
2. ✅ Создать `docker-compose.yml` в корне: сервисы `postgres`, `api`, `app`, `landing`; тома для данных PostgreSQL
3. ✅ Создать `.env.example` с переменными: `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `PORT`
4. ✅ Создать `Makefile` с командами: `make up`, `make down`, `make migrate`, `make migration:create NAME=...`,
   `make migration:revert`, `make db:reset`, `make seed`
5. ✅ Настроить GitHub Actions: workflow `ci.yml` — lint + build + test для всех приложений при пуше в `main` и при
   открытии PR
6. ✅ Добавить `.dockerignore` и `Dockerfile` для `api`, `app`, `landing`
7. ✅ Настроить `turbo.json` pipeline: задать зависимости задач между приложениями

---

## ✅ Этап 2. Общие типы, база данных и TypeORM

Создаём общий пакет с интерфейсами сущностей, проектируем схему и подключаем ORM к NestJS.

**Задачи:**

1. ✅ Создать пакет `packages/common`:
   - Инициализировать `package.json` с именем `@daylist/common`
   - Настроить `tsconfig.json` (strict, `declaration: true`)
   - Добавить пакет в зависимости `apps/api` и `apps/app` через workspace-ссылку
2. ✅ Определить TypeScript-интерфейсы сущностей в `packages/common/types/entities` (все имеют `id: string`,
   `createdAt: Date`, `updatedAt: Date`):
   - `IUser` — `id`, `email`, `passwordHash?`, `googleId?`, `createdAt`, `updatedAt`
   - `ICategory` — `id`, `userId`, `name`, `type: 'task' | 'note' | 'finance'`, `position`, `createdAt`, `updatedAt`
   - `ITask` — `id`, `userId`, `categoryId`, `parentId?`, `title`, `completed`, `position`, `createdAt`, `updatedAt`
   - `INote` — `id`, `userId`, `categoryId`, `title`, `content`, `taskId?`, `financeEntryId?`, `createdAt`, `updatedAt`
   - `IFinanceEntry` — `id`, `userId`, `categoryId`, `amount: number`, `type: 'income' | 'expense'`, `description?`,
     `date: Date`, `currency: string`, `createdAt`, `updatedAt`
   - Экспортировать всё через `packages/common/index.ts`
3. ✅ Установить зависимости в `apps/api`: `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/config`
4. ✅ Создать `DatabaseModule` с подключением через `TypeOrmModule.forRootAsync`, читающим `DATABASE_URL` из окружения
5. ✅ Реализовать TypeORM-сущности в `apps/api`, реализующие соответствующие интерфейсы из `@daylist/common`:
   - `User implements IUser`, `Category implements ICategory`, `Task implements ITask`, `Note implements INote`,
     `FinanceEntry implements IFinanceEntry`
6. ✅ Настроить TypeORM migrations (не `synchronize: true`): папка `apps/api/src/typeorm/migrations/`
7. ✅ Создать первую миграцию `InitSchema` со всеми таблицами
8. ✅ Написать `SeedService` для создания дефолтных категорий при регистрации пользователя

---

## ✅ Этап 3. Аутентификация (API)

Реализуем auth: email/пароль, JWT access tokens + opaque refresh tokens (случайные байты, хранятся в БД как SHA-256 хэш).

**Задачи:**

1. ✅ Установить: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-local`, `passport-jwt`, `bcrypt`
2. ✅ Создать миграцию и TypeORM-сущность `RefreshToken` (`id`, `userId`, `token` (хэш), `expiresAt`, `createdAt`) для
   хранения выданных refresh токенов в БД
3. ✅ Создать `AuthModule` с эндпоинтами:
   - `POST /api/auth/register` — регистрация email/пароль; возвращает `access_token` (короткоживущий, 15 мин) и
     `refresh_token` (долгоживущий, 30 дней)
   - `POST /api/auth/login` — вход email/пароль; возвращает `access_token` и `refresh_token`
   - `POST /api/auth/refresh` — принимает `refresh_token`, валидирует по БД, возвращает новую пару токенов (ротация:
     старый refresh токен инвалидируется)
   - `GET /api/auth/me` — текущий пользователь (guard по access_token)
   - `POST /api/auth/logout` — принимает `refresh_token`, удаляет запись из БД; access_token истекает сам
4. ✅ Реализовать `JwtAuthGuard` (валидация access_token) и декоратор `@CurrentUser()`
5. ✅ Настроить `ConfigModule` глобально для чтения `.env`; добавить переменные `JWT_SECRET`,
   `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` в `.env.example`; создать `auth.config.ts` по аналогии с
   `seed.config.ts` — `registerAs('auth', ...)` с zod-схемой, валидирующей все три переменные при старте приложения;
   подключить `authConfig` в `AuthModule` через `ConfigModule.forFeature(authConfig)`
6. ✅ Написать unit-тесты для `AuthService`

---

## Этап 4. CRUD API для задач, заметок и финансов

Реализуем REST API для всех трёх доменов и для категорий.

**Задачи:**

1. Создать `CategoriesModule`: CRUD `/api/categories` (фильтрация по `type`), проверка владельца
2. Создать `TasksModule`: CRUD `/api/tasks`, фильтрация по `categoryId` и `parentId`, endpoint для массового обновления
   `position`
3. Создать `NotesModule`: CRUD `/api/notes`, фильтрация по `categoryId`, `taskId`, `financeEntryId`
4. Создать `FinanceModule`: CRUD `/api/finance/entries`, фильтрация по `categoryId`, диапазону дат, типу
5. Создать `FinanceAnalyticsModule`: `GET /api/finance/analytics` с параметрами `from`, `to` — возвращает: баланс,
   разбивку по категориям, динамику по дням, сравнение с предыдущим периодом, средние значения, топ категорий,
   крупнейшие транзакции, % сбережений
6. Все контроллеры защищены `JwtAuthGuard`; каждый запрос фильтрует данные по `userId` из токена
7. Добавить `ValidationPipe` глобально, создать DTO с `class-validator` для каждого модуля
8. Написать unit-тесты для сервисов (моки репозиториев)

---

## Этап 5. Дизайн-система и layout фронтенда

Создаём визуальную основу: цветовая схема, компоненты, адаптивная навигация.

**Задачи:**

1. Установить зависимости: `shadcn/ui` (init), `@radix-ui/*`, `clsx`, `tailwind-merge`, `lucide-react`
2. Определить цветовую палитру в `globals.css` через CSS-переменные Tailwind: нейтральные средние тона (не светлые, не
   тёмные)
3. Создать компонент `AppLayout` с адаптивным поведением:
   - `Sidebar` (desktop, 768px+): логотип, навигационные ссылки (Задачи, Заметки, Финансы), ссылка на профиль внизу
   - `TabBar` (mobile, до 768px): нижняя панель с иконками и подписями
4. Создать страницы-заглушки: `/tasks`, `/notes`, `/finance`, `/profile`, `/auth/login`, `/auth/register`
5. Реализовать `AppShell` — обёртка для аутентифицированных страниц; неаутентифицированные редиректятся на `/auth/login`
6. Настроить Storybook: установить, добавить stories для `Sidebar`, `TabBar`, базовых UI-компонентов
7. Задать максимальную ширину контента 1600px с центрированием

---

## Этап 6. Аутентификация (фронтенд)

Связываем UI с API, управляем сессией на клиенте.

**Задачи:**

1. Установить: `axios` или `ky` для HTTP-клиента; `zustand` для глобального стора
2. Создать `authStore` (Zustand): `user`, `accessToken`, `isAuthenticated`, `login`, `logout`, `setUser`
3. Реализовать страницы `/auth/login` и `/auth/register` с формами (shadcn `Form`, `react-hook-form`, `zod`)
4. Создать `apiClient` — экземпляр axios с базовым URL; интерцептор запроса добавляет
   `Authorization: Bearer <accessToken>`; интерцептор ответа при 401 автоматически вызывает `POST /api/auth/refresh` и
   повторяет исходный запрос с новым access_token
5. Создать хук `useCurrentUser` — при монтировании проверяет токен через `GET /api/auth/me`
6. Реализовать страницу `/profile`: email пользователя, кнопка выхода

---

## Этап 7. Offline-first: IndexedDB и локальный стор

Приложение должно работать без интернета и аккаунта.

**Задачи:**

1. Установить `idb` (обёртка над IndexedDB)
2. Создать `db.ts` — инициализация базы с object stores: `tasks`, `notes`, `financeEntries`, `categories`; локальные
   типы расширяют интерфейсы из `@daylist/common`, добавляя `syncStatus: 'synced' | 'pending' | 'deleted'`
3. Создать сервисы для каждого домена (`TasksLocalService`, `NotesLocalService`, и т.д.) с методами: `getAll`,
   `getById`, `create`, `update`, `delete`; при записи генерировать `id` (uuid v4) на клиенте, проставлять `createdAt`/
   `updatedAt`, ставить `syncStatus = 'pending'`
4. Создать Zustand-сторы для каждого домена, работающие поверх локальных сервисов: `useTasksStore`, `useNotesStore`,
   `useFinanceStore`
5. Создать `SyncService` — при наличии токена и онлайн-соединения (`navigator.onLine`): отправляет pending-записи на
   сервер, получает обновления с сервера, разрешает конфликты по `updatedAt` (last write wins), обновляет `syncStatus`
6. Подписать `SyncService` на события `online`/`offline`; при логине запускать первичную синхронизацию
7. Отображать индикатор статуса синхронизации в `Sidebar`/`TabBar`

---

## Этап 8. Раздел "Задачи"

Полноценный интерфейс управления задачами с drag-and-drop.

**Задачи:**

1. Установить `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
2. Реализовать страницу `/tasks`:
   - Левая панель (или дропдаун на мобиле): список категорий с кнопкой добавления
   - Основная область: список задач выбранной категории
3. Реализовать компонент `TaskItem`: чекбокс, заголовок, кнопка добавления подзадачи, кнопка удаления, drag handle
4. Реализовать вложенность: подзадачи рендерятся под родителем с отступом; drag-and-drop для вложения (drop задачи на
   задачу делает её подзадачей)
5. Перемещение между категориями: только для задач верхнего уровня (без `parentId`); подзадачи следуют за родителем
6. При изменении порядка — обновлять поле `position` в сторе, дебаунсить сохранение
7. Компонент `CategoryManager`: создание, переименование, удаление категорий задач
8. Написать Storybook stories для `TaskItem`, `TaskList`

---

## Этап 9. Раздел "Заметки"

Простой список заметок с привязкой к задачам и финансам.

**Задачи:**

1. Реализовать страницу `/notes`:
   - Левая панель: список категорий
   - Основная область: список карточек заметок (заголовок + первые строки контента)
2. Реализовать страницу/модал `/notes/[id]`: textarea для текстового содержимого (без форматирования), поле заголовка,
   выбор категории
3. Добавить опциональное поле привязки: дропдаун выбора задачи (`taskId`) или записи финансов (`financeEntryId`)
4. Создание новой заметки: FAB-кнопка или кнопка в шапке
5. Удаление заметки с подтверждением (Radix `AlertDialog`)
6. Написать Storybook stories для `NoteCard`, `NoteEditor`

---

## Этап 10. Раздел "Финансы" — записи

Интерфейс ввода и просмотра финансовых записей.

**Задачи:**

1. Реализовать страницу `/finance`:
   - Фильтры: выбор периода (неделя / месяц / кастомный диапазон), фильтр по категории, фильтр по типу (доход/расход)
   - Список записей: дата, сумма (зелёный для дохода, красный для расхода), категория, описание
2. Реализовать форму создания/редактирования записи (модал или отдельная страница): сумма, тип, категория, описание,
   дата; валюта пока только RUB (поле в DTO есть, UI не отображает)
3. Реализовать `CategoryManager` для финансов (аналогично задачам)
4. Краткая сводка вверху страницы: итого доходов, итого расходов, баланс за выбранный период
5. Написать Storybook stories для `FinanceEntryItem`, `FinanceForm`

---

## Этап 11. Раздел "Финансы" — аналитика

Дашборд с графиками и метриками.

**Задачи:**

1. Установить `recharts` для графиков
2. Создать страницу `/finance/analytics` с селектором периода
3. Реализовать компоненты:
   - `BalanceCard` — баланс за период (доходы − расходы)
   - `CategoryBreakdown` — pie/bar chart разбивки по категориям
   - `DynamicsChart` — line chart динамики доходов и расходов по дням
   - `PeriodComparison` — сравнение текущего и предыдущего аналогичного периода
   - `AveragesCard` — средний расход в день и месяц
   - `TopCategories` — топ категорий по объёму трат
   - `LargestTransactions` — список крупнейших транзакций за период
   - `SavingsRate` — % сбережений
4. Аналитика для офлайн-режима: вычислять все метрики локально из IndexedDB (без запроса к API)
5. Написать Storybook stories для ключевых графиков

---

## Этап 12. Полировка, тесты и подготовка к деплою

Финальный этап: качество, надёжность, документация.

**Задачи:**

1. Написать e2e тесты для API: регистрация, логин, CRUD задач, синхронизация конфликтов
2. Добавить обработку ошибок на фронте: глобальный error boundary, toast-уведомления для ошибок API и успешных операций
3. Добавить состояния загрузки: skeleton-компоненты для списков задач, заметок, финансов
4. Провести аудит доступности (a11y): keyboard navigation, ARIA-атрибуты
5. Настроить `Dockerfile` для продакшн-сборки `api` (multi-stage) и `web`
6. Обновить GitHub Actions: добавить job для сборки Docker-образов и публикации в реестр
7. Написать `README.md` с инструкциями по локальному запуску, структурой проекта, описанием команд Makefile
