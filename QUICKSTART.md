# Быстрый старт

## Локальная разработка

### Требования
- Docker и Docker Compose
- Node.js 18+ (для локальной разработки без Docker)

### Запуск с Docker

1. Клонируйте репозиторий и перейдите в директорию проекта

2. Запустите все сервисы:
```bash
docker-compose up -d
```

3. Выполните миграции базы данных:
```bash
docker-compose exec backend npm run migrate
```

4. (Опционально) Заполните базу тестовыми данными:
```bash
docker-compose exec backend npm run seed
```

5. Откройте в браузере:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Локальная разработка без Docker

#### Backend

1. Установите PostgreSQL и создайте базу данных:
```bash
createdb events_db
```

2. Настройте переменные окружения:
```bash
cd backend
cp .env.example .env
# Отредактируйте .env файл
```

3. Установите зависимости и запустите:
```bash
npm install
npm run migrate
npm run seed  # опционально
npm run dev
```

#### Frontend

1. Настройте переменные окружения:
```bash
cd frontend
# Создайте .env.local файл:
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

2. Установите зависимости и запустите:
```bash
npm install
npm run dev
```

## Тестовый аккаунт администратора

После выполнения seed скрипта:
- Email: `admin@example.com`
- Пароль: `admin123`

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь

### События
- `GET /api/events` - Список событий (с фильтрами)
- `GET /api/events/:id` - Детали события
- `POST /api/events` - Создать событие (admin)
- `PUT /api/events/:id` - Обновить событие (admin)
- `DELETE /api/events/:id` - Удалить событие (admin)

### Места
- `GET /api/places` - Список мест
- `GET /api/places/:id` - Детали места
- `POST /api/places` - Создать место (admin)
- `PUT /api/places/:id` - Обновить место (admin)
- `DELETE /api/places/:id` - Удалить место (admin)

### Избранное
- `GET /api/favorites` - Список избранного (auth)
- `POST /api/favorites` - Добавить в избранное (auth)
- `DELETE /api/favorites/:eventId` - Удалить из избранного (auth)
- `GET /api/favorites/check/:eventId` - Проверить избранное (auth)

### Подписки
- `GET /api/subscriptions` - Список подписок (auth)
- `POST /api/subscriptions` - Подписаться на место (auth)
- `DELETE /api/subscriptions/:placeId` - Отписаться (auth)
- `GET /api/subscriptions/check/:placeId` - Проверить подписку (auth)

### Жалобы
- `POST /api/complaints` - Создать жалобу (auth)
- `GET /api/complaints` - Список жалоб (admin)
- `PUT /api/complaints/:id` - Обновить статус жалобы (admin)

### Админка
- `GET /api/admin/stats` - Статистика (admin)
- `GET /api/admin/users` - Список пользователей (admin)
- `PUT /api/admin/users/:id/role` - Изменить роль пользователя (admin)

## Структура проекта

```
/
├── backend/              # Backend API (Express.js)
│   ├── src/
│   │   ├── routes/      # API роуты
│   │   ├── db/          # База данных (миграции, seed)
│   │   ├── middleware/  # Middleware (auth)
│   │   └── utils/       # Утилиты
│   └── package.json
│
├── frontend/            # Frontend (Next.js)
│   ├── app/             # Next.js App Router
│   ├── components/      # React компоненты
│   ├── contexts/        # React Context
│   └── lib/             # Утилиты (API клиент)
│
├── infrastructure/      # Конфигурация для Yandex Cloud
│   ├── terraform/       # Terraform конфигурация
│   └── README.md        # Инструкции по развертыванию
│
└── docker-compose.yml   # Docker Compose для локальной разработки
```

## Следующие шаги

1. Настройте переменные окружения для production
2. Настройте SSL сертификаты
3. Настройте мониторинг и логирование
4. Добавьте тесты
5. Настройте CI/CD

