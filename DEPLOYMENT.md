# Инструкция по развертыванию в Production

## Подготовка к развертыванию

### 1. Настройка переменных окружения

#### Backend
Создайте файл `.env` в директории `backend/` на основе `.env.production.example`:
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@your-postgres-host:5432/events_db
JWT_SECRET=your-very-secure-random-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
```

#### Frontend
Создайте файл `.env.production` в директории `frontend/`:
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### 2. Сборка Docker образов

```bash
# Backend
cd backend
docker build -t events-backend:latest .

# Frontend
cd frontend
docker build -t events-frontend:latest .
```

### 3. Развертывание в Yandex Cloud

#### Вариант 1: Использование Terraform

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

#### Вариант 2: Ручное развертывание

1. **Создание Container Registry:**
```bash
yc container registry create --name events-registry
```

2. **Загрузка образов:**
```bash
# Авторизация
yc container registry configure-docker

# Тегирование и загрузка
docker tag events-backend:latest cr.yandex/YOUR_REGISTRY_ID/events-backend:latest
docker tag events-frontend:latest cr.yandex/YOUR_REGISTRY_ID/events-frontend:latest

docker push cr.yandex/YOUR_REGISTRY_ID/events-backend:latest
docker push cr.yandex/YOUR_REGISTRY_ID/events-frontend:latest
```

3. **Создание Serverless Container для Backend:**
```bash
yc serverless container create --name events-backend

yc serverless container revision deploy \
  --container-name events-backend \
  --image cr.yandex/YOUR_REGISTRY_ID/events-backend:latest \
  --cores 2 \
  --memory 2GB \
  --service-account-id YOUR_SERVICE_ACCOUNT_ID \
  --environment DATABASE_URL="postgresql://..." \
  --environment JWT_SECRET="..." \
  --environment JWT_EXPIRES_IN="7d" \
  --environment NODE_ENV="production"
```

4. **Создание Serverless Container для Frontend:**
```bash
yc serverless container create --name events-frontend

yc serverless container revision deploy \
  --container-name events-frontend \
  --image cr.yandex/YOUR_REGISTRY_ID/events-frontend:latest \
  --cores 1 \
  --memory 1GB \
  --environment NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api"
```

5. **Настройка Application Load Balancer:**
   - Создайте target group для backend
   - Создайте target group для frontend
   - Настройте правила маршрутизации:
     - `/api/*` → backend
     - `/*` → frontend

### 4. Настройка базы данных

```bash
# Подключение к базе данных
psql -h YOUR_DB_HOST -U events_user -d events_db

# Выполнение миграций
\i backend/src/db/schema.sql

# (Опционально) Заполнение тестовыми данными
node backend/src/db/seed.js
```

### 5. Настройка домена и SSL

1. Настройте DNS записи для вашего домена
2. Настройте SSL сертификат через Yandex Certificate Manager
3. Привяжите сертификат к Load Balancer

### 6. Мониторинг

Настройте:
- Yandex Monitoring для метрик
- Yandex Logging для логов
- Алерты на критические ошибки

## Проверка работоспособности

1. Проверьте health check endpoint: `https://api.yourdomain.com/health`
2. Проверьте главную страницу: `https://yourdomain.com`
3. Проверьте регистрацию и вход
4. Проверьте создание событий (для админа)

## Обновление приложения

```bash
# 1. Соберите новые образы
docker build -t events-backend:latest ./backend
docker build -t events-frontend:latest ./frontend

# 2. Загрузите в registry
docker push cr.yandex/YOUR_REGISTRY_ID/events-backend:latest
docker push cr.yandex/YOUR_REGISTRY_ID/events-frontend:latest

# 3. Обновите ревизии контейнеров
yc serverless container revision deploy --container-name events-backend --image ...
yc serverless container revision deploy --container-name events-frontend --image ...
```

## Резервное копирование

Настройте автоматическое резервное копирование базы данных:
```bash
# Yandex Managed PostgreSQL автоматически создает бэкапы
# Настройте расписание через консоль или API
```

## Безопасность

1. ✅ Используйте сильные секретные ключи
2. ✅ Настройте HTTPS
3. ✅ Ограничьте доступ к базе данных
4. ✅ Используйте переменные окружения для секретов
5. ✅ Настройте rate limiting
6. ✅ Регулярно обновляйте зависимости

