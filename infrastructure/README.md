# Инфраструктура для Yandex Cloud

Этот каталог содержит конфигурацию для развертывания приложения в Yandex Cloud.

## Компоненты инфраструктуры

### 1. База данных
- **Yandex Managed Service for PostgreSQL**
- Версия: PostgreSQL 15
- Минимальная конфигурация: 2 vCPU, 4 GB RAM

### 2. Backend
- **Yandex Container Registry** для хранения Docker образов
- **Yandex Serverless Containers** для запуска backend API
- Или **Yandex Compute Cloud** с Docker контейнерами

### 3. Frontend
- **Yandex Object Storage** для статических файлов
- **Yandex Cloud CDN** для ускорения доставки контента
- Или **Yandex Serverless Containers** для SSR

### 4. Load Balancer
- **Yandex Application Load Balancer** для распределения нагрузки

## Развертывание

### Шаг 1: Создание базы данных

```bash
# Создать кластер PostgreSQL через Yandex Cloud Console
# Или использовать YC CLI:
yc managed-postgresql cluster create \
  --name events-db \
  --network-name default \
  --resource-preset s2.micro \
  --disk-size 20 \
  --user-name events_user \
  --user-password YOUR_PASSWORD \
  --database-name events_db
```

### Шаг 2: Создание Container Registry

```bash
yc container registry create --name events-registry
```

### Шаг 3: Сборка и загрузка образов

```bash
# Backend
cd backend
docker build -t cr.yandex/YOUR_REGISTRY_ID/events-backend:latest .
docker push cr.yandex/YOUR_REGISTRY_ID/events-backend:latest

# Frontend
cd frontend
docker build -t cr.yandex/YOUR_REGISTRY_ID/events-frontend:latest .
docker push cr.yandex/YOUR_REGISTRY_ID/events-frontend:latest
```

### Шаг 4: Создание Serverless Container для Backend

```bash
yc serverless container create --name events-backend
yc serverless container revision deploy \
  --container-name events-backend \
  --image cr.yandex/YOUR_REGISTRY_ID/events-backend:latest \
  --cores 1 \
  --memory 1GB \
  --service-account-id YOUR_SERVICE_ACCOUNT_ID \
  --environment DATABASE_URL=postgresql://... \
  --environment JWT_SECRET=YOUR_SECRET
```

### Шаг 5: Настройка Load Balancer

Создайте Application Load Balancer через консоль или используйте Terraform конфигурацию.

### Шаг 6: Развертывание Frontend

#### Вариант 1: Object Storage + CDN
```bash
# Собрать статический сайт
cd frontend
npm run build
npm run export

# Загрузить в Object Storage
yc storage cp --recursive out/ s3://events-frontend/
```

#### Вариант 2: Serverless Container
```bash
yc serverless container create --name events-frontend
yc serverless container revision deploy \
  --container-name events-frontend \
  --image cr.yandex/YOUR_REGISTRY_ID/events-frontend:latest \
  --cores 1 \
  --memory 1GB \
  --environment NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

## Переменные окружения

### Backend
- `DATABASE_URL` - строка подключения к PostgreSQL
- `JWT_SECRET` - секретный ключ для JWT
- `JWT_EXPIRES_IN` - время жизни токена (по умолчанию 7d)
- `PORT` - порт сервера (по умолчанию 3001)
- `NODE_ENV` - окружение (production/development)

### Frontend
- `NEXT_PUBLIC_API_URL` - URL backend API

## Terraform

Для автоматизации развертывания используйте Terraform конфигурацию (см. `terraform/`).

## Мониторинг

Настройте мониторинг через:
- Yandex Monitoring для метрик
- Yandex Logging для логов
- Yandex Trace для трейсинга

