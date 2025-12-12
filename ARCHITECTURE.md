# Архитектура проекта

## Обзор

Сайт-афиша событий построен на архитектуре с разделением на frontend и backend, использующей RESTful API для взаимодействия.

## Технологический стек

### Backend
- **Node.js** + **Express.js** - серверная часть
- **PostgreSQL** - реляционная база данных
- **JWT** - аутентификация
- **bcryptjs** - хеширование паролей
- **express-validator** - валидация запросов

### Frontend
- **Next.js 14** - React фреймворк с App Router
- **TypeScript** - типизация
- **Tailwind CSS** - стилизация
- **Axios** - HTTP клиент
- **React Context** - управление состоянием

### Инфраструктура
- **Docker** - контейнеризация
- **Yandex Cloud**:
  - Managed PostgreSQL
  - Container Registry
  - Serverless Containers
  - Object Storage + CDN
  - Application Load Balancer

## Структура базы данных

### Основные таблицы

1. **users** - пользователи системы
   - id, email, password, name, role

2. **cities** - города
   - id, name, slug

3. **categories** - категории событий
   - id, name, slug

4. **places** - места проведения (музеи, театры и т.д.)
   - id, name, type, address, city_id, description

5. **events** - события
   - id, title, description, start_date, end_date, average_price, link, organizer, category_id, place_id, city_id

6. **favorites** - избранные события пользователей
   - id, user_id, event_id

7. **subscriptions** - подписки на места
   - id, user_id, place_id

8. **complaints** - жалобы на события
   - id, user_id, event_id, reason, status

## API Архитектура

### Аутентификация
- JWT токены в HTTP заголовке `Authorization: Bearer <token>`
- Токены хранятся в cookies на клиенте
- Middleware `authenticate` проверяет токен на защищенных роутах
- Middleware `requireAdmin` проверяет роль администратора

### Роутинг
Все API роуты находятся в `/api/*`:
- `/api/auth/*` - аутентификация
- `/api/events/*` - управление событиями
- `/api/places/*` - управление местами
- `/api/categories/*` - категории
- `/api/cities/*` - города
- `/api/favorites/*` - избранное (требует auth)
- `/api/subscriptions/*` - подписки (требует auth)
- `/api/complaints/*` - жалобы
- `/api/admin/*` - админ-панель (требует admin)

## Frontend Архитектура

### Структура страниц (App Router)
- `/` - главная страница со списком событий
- `/login` - вход
- `/register` - регистрация
- `/favorites` - избранное
- `/subscriptions` - подписки
- `/events/[id]` - детали события
- `/events/[id]/complaint` - форма жалобы
- `/admin` - админ-панель

### Компоненты
- `Header` - навигация
- `EventCard` - карточка события
- `CityFilter` - фильтр по городам
- `CategoryFilter` - фильтр по категориям

### Контексты
- `AuthContext` - управление аутентификацией пользователя

## Безопасность

1. **Пароли**: хешируются с помощью bcryptjs
2. **JWT**: секретный ключ хранится в переменных окружения
3. **Валидация**: все входные данные валидируются
4. **CORS**: настроен для разрешенных доменов
5. **Helmet**: защита HTTP заголовков
6. **SQL Injection**: защита через параметризованные запросы

## Масштабируемость

### Горизонтальное масштабирование
- Backend может быть развернут в нескольких контейнерах
- Load Balancer распределяет нагрузку
- База данных может быть реплицирована

### Вертикальное масштабирование
- Настройка ресурсов контейнеров
- Оптимизация запросов к БД
- Индексы в базе данных

## Развертывание

### Локальная разработка
- Docker Compose для всех сервисов
- Автоматические миграции БД

### Production (Yandex Cloud)
1. Managed PostgreSQL для БД
2. Container Registry для образов
3. Serverless Containers для backend
4. Object Storage + CDN для frontend
5. Application Load Balancer для маршрутизации

## Мониторинг и логирование

Рекомендуется настроить:
- Yandex Monitoring для метрик
- Yandex Logging для логов
- Алерты на критические ошибки
- Трейсинг запросов

## Будущие улучшения

1. Кэширование (Redis)
2. Поиск (Elasticsearch)
3. Уведомления (email, push)
4. Аналитика событий
5. Рейтинги и отзывы
6. Социальные функции (комментарии, лайки)
7. Мобильное приложение

