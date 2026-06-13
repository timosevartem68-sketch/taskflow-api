# TaskFlow API

TaskFlow API - backend-сервис для управления рабочими пространствами, проектами и задачами. Проект развивается как Jira-like система: с пользователями, ролями, рабочими пространствами, проектами, задачами, статусами, приоритетами, назначением исполнителей и API для будущего фронтенда.

## Цель проекта

Цель TaskFlow - создать современную систему управления задачами, которая по идее похожа на Jira, но проще, быстрее и понятнее для учебной разработки.

Сейчас реализован backend API. В дальнейшем планируется добавить фронтенд, доски задач, спринты, комментарии, уведомления, вложения и аналитику по задачам.

## Стек технологий

* Python 3.13+
* FastAPI
* PostgreSQL
* SQLAlchemy 2.x Async
* Alembic
* Pydantic
* JWT Authentication
* Docker
* Docker Compose
* Pytest
* GitHub Actions CI

## Основные возможности

### Авторизация

* Регистрация пользователя
* Логин пользователя
* JWT access token
* Получение текущего пользователя через `/me`
* Защита API через Bearer token

### Рабочие пространства

* Создание workspace
* Получение списка workspace пользователя
* Получение workspace по ID
* Обновление workspace
* Роли участников workspace

### Проекты

* Создание проекта внутри workspace
* Получение списка проектов workspace
* Получение проекта по ID
* Обновление проекта
* Удаление проекта

### Задачи

* Создание задачи
* Получение списка задач по `project_id`
* Получение задачи по ID
* Обновление задачи
* Обновление статуса задачи
* Назначение исполнителя
* Удаление задачи
* Фильтрация по статусу, приоритету, исполнителю, автору
* Поиск по задачам
* Пагинация
* Сортировка

### Роли и права

В проекте используются роли workspace:

* `owner`
* `admin`
* `member`
* `viewer`

Базовая логика прав:

* `owner` - полный доступ
* `admin` - управление проектами и задачами
* `member` - создание и изменение задач
* `viewer` - только просмотр

## Архитектура проекта

```txt
app/
  api/
    deps.py
    v1/
      auth.py
      workspaces.py
      projects.py
      tasks.py
      router.py

  core/
    config.py
    exceptions.py
    permissions.py
    security.py

  db/
    base.py
    session.py

  models/
    user.py
    workspace.py
    workspace_member.py
    project.py
    task.py

  repositories/
    user_repository.py
    workspace_repository.py
    project_repository.py
    task_repository.py

  schemas/
    common.py
    user.py
    workspace.py
    project.py
    task.py

  services/
    auth_service.py
    workspace_service.py
    project_service.py
    task_service.py
```

## Архитектурный подход

Проект разделён на слои:

```txt
api/v1/*.py        - HTTP endpoints
services/*.py      - бизнес-логика
repositories/*.py  - работа с базой данных
models/*.py        - SQLAlchemy модели
schemas/*.py       - Pydantic схемы
core/*.py          - настройки, безопасность, ошибки, права
```

Такой подход делает код чище и ближе к реальным production-проектам.

## Переменные окружения

Для локального запуска нужен файл `.env`.

Пример:

```env
APP_NAME=TaskFlow API
ENVIRONMENT=local
DATABASE_URL=postgresql+asyncpg://taskflow:taskflow@localhost:5432/taskflow
JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Локальный запуск

### 1. Установить зависимости

```bash
pip install -r requirements.txt
```

### 2. Запустить PostgreSQL

```bash
docker compose up -d db
```

### 3. Применить миграции

```bash
alembic upgrade head
```

### 4. Запустить FastAPI

```bash
python -m uvicorn app.main:app --reload
```

Документация API будет доступна по адресу:

```txt
http://127.0.0.1:8000/docs
```

## Запуск через Docker

Проект можно запустить одной командой:

```bash
docker compose up --build
```

При старте API-контейнер автоматически применяет миграции Alembic:

```bash
alembic upgrade head
```

После запуска доступны:

```txt
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/health
http://127.0.0.1:8000/db-health
```

Остановить контейнеры:

```bash
docker compose down
```

Остановить контейнеры и удалить данные PostgreSQL:

```bash
docker compose down -v
```

## Тесты

В проекте настроены тесты через `pytest`.

Запуск тестов:

```bash
pytest -q
```

Покрыты тестами:

* health check
* OpenAPI schema
* auth API
* workspace API
* project API
* task API

Для тестов используется отдельная SQLite-база:

```txt
test_taskflow.db
```

Она не должна попадать в Git.

## CI/CD

В проекте настроен GitHub Actions workflow:

```txt
.github/workflows/tests.yml
```

При каждом `push` и `pull_request` GitHub автоматически выполняет:

```txt
1. Установку Python
2. Установку зависимостей
3. Запуск pytest
4. Проверку Docker build
```

Это помогает быстро понимать, сломан проект или нет.

## Текущий статус проекта

Готово:

* FastAPI приложение
* PostgreSQL
* SQLAlchemy async
* Alembic migrations
* JWT авторизация
* Пользователи
* Workspaces
* Projects
* Tasks
* Роли и права
* Custom exceptions
* Русские сообщения ошибок
* Глобальные обработчики ошибок
* Pytest API tests
* GitHub Actions CI
* Dockerfile
* Docker Compose
* Автоматический запуск миграций при старте API

## Roadmap

Планы развития проекта в сторону Jira-like системы:

### Ближайшие задачи

* Проверка `assignee_id`: исполнитель должен быть участником workspace
* Permission-тесты для ролей `owner`, `admin`, `member`, `viewer`
* Единый формат ошибок API
* Улучшение пагинации
* Улучшение фильтров задач
* Makefile или task runner для удобных команд

### Функции для Jira-like логики

* Доски задач
* Колонки доски
* Drag and drop статусы
* Спринты
* Эпики
* Комментарии к задачам
* История изменений задачи
* Метки задач
* Вложения
* Уведомления
* Командные роли
* Приглашение пользователей в workspace
* Аналитика по задачам
* Time tracking
* Activity log

### Фронтенд

Планируется отдельный frontend-интерфейс:

* HTML/CSS/JS на первом этапе
* Затем возможный переход на React/Vite
* Авторизация
* Dashboard
* Список workspaces
* Список проектов
* Kanban-доска задач
* Карточка задачи
* Фильтры и поиск
* Адаптивный интерфейс

## API документация

После запуска проекта документация доступна здесь:

```txt
http://127.0.0.1:8000/docs
```

Также доступна OpenAPI-схема:

```txt
http://127.0.0.1:8000/openapi.json
```

## Автор

Учебный backend-проект для прокачки навыков Python, FastAPI, PostgreSQL, Docker, тестирования и CI.
