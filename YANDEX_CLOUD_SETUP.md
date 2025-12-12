# Полная настройка Yandex Cloud с нуля 🚀

Это пошаговая инструкция для настройки всего проекта в Yandex Cloud, если у вас еще ничего не настроено.

## 📋 Предварительные требования

1. Аккаунт в Yandex Cloud (если нет - создайте на https://cloud.yandex.ru)
2. Установленный YC CLI (командная строка Yandex Cloud)
3. Docker (для сборки образов)

## Шаг 1: Установка YC CLI

### macOS
```bash
brew install yandex-cloud-cli
```

### Linux
```bash
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
```

### Windows
Скачайте установщик с https://cloud.yandex.ru/docs/cli/quickstart

### Инициализация
```bash
yc init
```

Следуйте инструкциям:
- Выберите облако (или создайте новое)
- Выберите каталог (или создайте новый)
- Выберите зону (например, `ru-central1-a`)

## Шаг 2: Создание Service Account

Service Account нужен для работы контейнеров:

```bash
# Создание Service Account
yc iam service-account create --name events-sa --description "Service account for events platform"

# Получение ID созданного аккаунта
SA_ID=$(yc iam service-account get --name events-sa --format json | jq -r '.id')
echo "Service Account ID: $SA_ID"

# Назначение роли editor
yc resource-manager folder add-access-binding default \
  --role editor \
  --subject serviceAccount:$SA_ID
```

Сохраните `SA_ID` - он понадобится позже.

## Шаг 3: Создание базы данных PostgreSQL

```bash
# Создание кластера PostgreSQL
yc managed-postgresql cluster create \
  --name events-db \
  --network-name default \
  --resource-preset s2.micro \
  --disk-type network-ssd \
  --disk-size 20 \
  --host zone-id=ru-central1-a,subnet-name=default-ru-central1-a \
  --user name=events_user,password=YOUR_SECURE_PASSWORD \
  --database name=events_db,owner=events_user

# Получение информации о кластере
yc managed-postgresql cluster get --name events-db

# Получение хоста базы данных
DB_HOST=$(yc managed-postgresql host list --cluster-name events-db --format json | jq -r '.[0].name')
echo "Database host: $DB_HOST"
```

**Важно:** Замените `YOUR_SECURE_PASSWORD` на надежный пароль (минимум 8 символов, буквы и цифры).

**Сохраните:**
- Имя пользователя: `events_user`
- Пароль: (тот, что вы указали)
- Хост: `$DB_HOST` (будет выведен командой выше)
- База данных: `events_db`

## Шаг 4: Создание Container Registry

```bash
# Создание реестра
yc container registry create --name events-registry

# Получение ID реестра
REGISTRY_ID=$(yc container registry get --name events-registry --format json | jq -r '.id')
echo "Registry ID: $REGISTRY_ID"

# Настройка Docker для работы с реестром
yc container registry configure-docker
```

**Сохраните `REGISTRY_ID`.**

## Шаг 5: Подготовка переменных окружения

Создайте файл с переменными (не коммитьте его в Git!):

```bash
# Создайте файл .env.production (не добавляйте в Git!)
cat > .env.production << EOF
# Database
DB_HOST=ваш-хост-базы-данных
DB_USER=events_user
DB_PASSWORD=ваш-пароль
DB_NAME=events_db
DATABASE_URL=postgresql://events_user:ваш-пароль@ваш-хост-базы-данных:5432/events_db

# JWT
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

# Service Account
SERVICE_ACCOUNT_ID=$SA_ID

# Registry
REGISTRY_ID=$REGISTRY_ID
EOF

# Загрузите переменные
source .env.production
```

## Шаг 6: Сборка Docker образов

### Backend

```bash
cd backend

# Создайте .env файл для backend
cat > .env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=$DATABASE_URL
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
EOF

# Сборка образа
docker build -t cr.yandex/$REGISTRY_ID/events-backend:latest .

# Загрузка в реестр
docker push cr.yandex/$REGISTRY_ID/events-backend:latest

cd ..
```

### Frontend

```bash
cd frontend

# Создайте .env.production файл
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
EOF

# Сборка образа
docker build -t cr.yandex/$REGISTRY_ID/events-frontend:latest .

# Загрузка в реестр
docker push cr.yandex/$REGISTRY_ID/events-frontend:latest

cd ..
```

## Шаг 7: Создание Serverless Containers

### Backend Container

```bash
# Создание контейнера
yc serverless container create --name events-backend

# Создание ревизии
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

# Получение URL контейнера
BACKEND_URL=$(yc serverless container get --name events-backend --format json | jq -r '.url')
echo "Backend URL: $BACKEND_URL"
```

### Frontend Container

```bash
# Создание контейнера
yc serverless container create --name events-frontend

# Создание ревизии
yc serverless container revision deploy \
  --container-name events-frontend \
  --image cr.yandex/$REGISTRY_ID/events-frontend:latest \
  --cores 1 \
  --memory 1GB \
  --environment NEXT_PUBLIC_API_URL="$BACKEND_URL/api"

# Получение URL контейнера
FRONTEND_URL=$(yc serverless container get --name events-frontend --format json | jq -r '.url')
echo "Frontend URL: $FRONTEND_URL"
```

## Шаг 8: Выполнение миграций базы данных

```bash
# Подключение к базе данных
yc managed-postgresql cluster connect \
  --name events-db \
  --user events_user \
  --database events_db

# В открывшейся консоли PostgreSQL выполните:
# \i backend/src/db/schema.sql
# \q

# Или через psql напрямую:
psql "host=$DB_HOST port=6432 sslmode=require dbname=events_db user=events_user" -f backend/src/db/schema.sql

# Заполнение тестовыми данными (опционально)
# Нужно будет настроить подключение из контейнера или локально
```

## Шаг 9: Настройка Application Load Balancer (опционально)

Если хотите использовать свой домен:

```bash
# Создание target group для backend
yc load-balancer target-group create \
  --name events-backend-tg \
  --target container-name=events-backend

# Создание target group для frontend
yc load-balancer target-group create \
  --name events-frontend-tg \
  --target container-name=events-frontend

# Создание балансировщика
yc load-balancer network-load-balancer create \
  --name events-lb \
  --listener name=http-listener,port=80,protocol=http \
  --target-group name=events-backend-tg,healthcheck-name=http-healthcheck
```

## Шаг 10: Проверка работоспособности

```bash
# Проверка backend
curl $BACKEND_URL/health

# Проверка frontend
curl $FRONTEND_URL
```

## Шаг 11: Настройка домена (опционально)

1. Настройте DNS записи для вашего домена:
   - A-запись: `@` → IP адрес Load Balancer
   - CNAME: `api` → ваш домен

2. Создайте SSL сертификат через Yandex Certificate Manager

3. Привяжите сертификат к Load Balancer

## 🔧 Полезные команды

### Просмотр логов

```bash
# Логи backend контейнера
yc logging read --resource-type serverless-container --resource-name events-backend

# Логи frontend контейнера
yc logging read --resource-type serverless-container --resource-name events-frontend
```

### Обновление контейнеров

```bash
# Пересборка и загрузка образа
docker build -t cr.yandex/$REGISTRY_ID/events-backend:latest ./backend
docker push cr.yandex/$REGISTRY_ID/events-backend:latest

# Создание новой ревизии
yc serverless container revision deploy \
  --container-name events-backend \
  --image cr.yandex/$REGISTRY_ID/events-backend:latest \
  --cores 2 \
  --memory 2GB \
  --service-account-id $SERVICE_ACCOUNT_ID \
  --environment DATABASE_URL="$DATABASE_URL" \
  --environment JWT_SECRET="$JWT_SECRET" \
  --environment JWT_EXPIRES_IN="7d" \
  --environment NODE_ENV="production"
```

### Удаление ресурсов (если нужно начать заново)

```bash
# Удаление контейнеров
yc serverless container delete --name events-backend
yc serverless container delete --name events-frontend

# Удаление реестра
yc container registry delete --name events-registry

# Удаление базы данных
yc managed-postgresql cluster delete --name events-db
```

## ⚠️ Важные моменты

1. **Безопасность:**
   - Никогда не коммитьте `.env.production` в Git
   - Используйте сильные пароли
   - Регулярно обновляйте зависимости

2. **Стоимость:**
   - Следите за использованием ресурсов
   - Настройте лимиты и алерты
   - Используйте бесплатный период для тестирования

3. **Резервное копирование:**
   - Настройте автоматические бэкапы БД
   - Храните копии важных данных

## 🆘 Если что-то пошло не так

1. Проверьте логи контейнеров
2. Проверьте переменные окружения
3. Проверьте подключение к базе данных
4. Проверьте права доступа Service Account

## 📚 Дополнительные ресурсы

- [Документация Yandex Cloud](https://cloud.yandex.ru/docs)
- [YC CLI Reference](https://cloud.yandex.ru/docs/cli/cli-reference/)
- [Serverless Containers](https://cloud.yandex.ru/docs/serverless-containers/)

## ✅ Чеклист готовности

- [ ] YC CLI установлен и настроен
- [ ] Service Account создан
- [ ] База данных PostgreSQL создана
- [ ] Container Registry создан
- [ ] Docker образы собраны и загружены
- [ ] Backend контейнер создан и работает
- [ ] Frontend контейнер создан и работает
- [ ] Миграции БД выполнены
- [ ] Health check проходит успешно
- [ ] Домен настроен (если используется)

---

**Готово!** Ваш проект должен быть доступен по URL контейнеров или через Load Balancer.

