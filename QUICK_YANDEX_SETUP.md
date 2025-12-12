# Быстрая настройка Yandex Cloud ⚡

## Вариант 1: Автоматическая настройка (рекомендуется)

```bash
# 1. Убедитесь, что YC CLI установлен
yc version

# Если нет - установите:
# macOS: brew install yandex-cloud-cli
# Linux: curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

# 2. Инициализируйте YC CLI (если еще не сделано)
yc init

# Убедитесь, что используете правильный каталог:
yc config set folder-id b1ggdi2brlp9vqlbg90a

# 3. Запустите скрипт автоматической настройки
./setup-yandex-cloud.sh

# 4. Загрузите созданную конфигурацию
source .yandex-cloud-config

# 5. Соберите и загрузите образы
cd backend
docker build -t cr.yandex/$REGISTRY_ID/events-backend:latest .
docker push cr.yandex/$REGISTRY_ID/events-backend:latest
cd ../frontend
docker build -t cr.yandex/$REGISTRY_ID/events-frontend:latest .
docker push cr.yandex/$REGISTRY_ID/events-frontend:latest
cd ..

# 6. Создайте контейнеры (см. команды ниже)
```

## Вариант 2: Ручная настройка

Следуйте подробной инструкции в `YANDEX_CLOUD_SETUP.md`

## Создание Serverless Containers

После загрузки образов:

### Backend Container

```bash
source .yandex-cloud-config

yc serverless container create --name events-backend

yc serverless container revision deploy \
  --container-name events-backend \
  --image cr.yandex/$REGISTRY_ID/events-backend:latest \
  --cores 2 \
  --memory 2GB \
  --service-account-id $SERVICE_ACCOUNT_ID \
  --environment DATABASE_URL="$DATABASE_URL" \
  --environment JWT_SECRET="$JWT_SECRET" \
  --environment JWT_EXPIRES_IN="7d" \
  --environment NODE_ENV="production" \
  --environment PORT="3001"
```

### Frontend Container

```bash
# Сначала получите URL backend
BACKEND_URL=$(yc serverless container get --name events-backend --format json | jq -r '.url')

yc serverless container create --name events-frontend

yc serverless container revision deploy \
  --container-name events-frontend \
  --image cr.yandex/$REGISTRY_ID/events-frontend:latest \
  --cores 1 \
  --memory 1GB \
  --environment NEXT_PUBLIC_API_URL="$BACKEND_URL/api"
```

## Выполнение миграций БД

```bash
source .yandex-cloud-config

# Вариант 1: Через psql (если установлен локально)
psql "$DATABASE_URL" -f backend/src/db/schema.sql

# Вариант 2: Через YC CLI
yc managed-postgresql cluster connect --name events-db --user events_user --database events_db
# Затем в консоли: \i backend/src/db/schema.sql
```

## Проверка

```bash
# Получите URL контейнеров
BACKEND_URL=$(yc serverless container get --name events-backend --format json | jq -r '.url')
FRONTEND_URL=$(yc serverless container get --name events-frontend --format json | jq -r '.url')

# Проверка backend
curl $BACKEND_URL/health

# Проверка frontend
curl $FRONTEND_URL
```

## Что дальше?

1. ✅ Инфраструктура создана
2. ⏳ Настройте домен (если нужно)
3. ⏳ Настройте SSL сертификат
4. ⏳ Настройте Load Balancer
5. ⏳ Настройте мониторинг

См. `YANDEX_CLOUD_SETUP.md` для подробностей.

