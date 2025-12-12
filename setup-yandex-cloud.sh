#!/bin/bash

# Скрипт для автоматической настройки Yandex Cloud
# Использование: ./setup-yandex-cloud.sh

set -e

echo "🚀 Настройка Yandex Cloud для Events Platform"
echo "=============================================="
echo ""

# Проверка установки YC CLI
if ! command -v yc &> /dev/null; then
    echo "❌ YC CLI не установлен!"
    echo "Установите его:"
    echo "  macOS: brew install yandex-cloud-cli"
    echo "  Linux: curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash"
    exit 1
fi

echo "✅ YC CLI установлен"

# Проверка инициализации
if ! yc config list &> /dev/null; then
    echo "⚠️  YC CLI не инициализирован. Запустите: yc init"
    exit 1
fi

echo "✅ YC CLI инициализирован"
echo ""

# Шаг 1: Service Account
echo "📝 Шаг 1: Создание Service Account..."
SA_NAME="events-sa"

FOLDER_ID="b1ggdi2brlp9vqlbg90a"
echo "📁 Используется каталог: $FOLDER_ID"

# Установка каталога по умолчанию
yc config set folder-id $FOLDER_ID

# Проверка существования Service Account в нужном каталоге
SA_ID=""
SA_LIST=$(yc iam service-account list --folder-id $FOLDER_ID --format json 2>/dev/null || echo "[]")
SA_ID=$(echo "$SA_LIST" | jq -r ".[] | select(.name == \"$SA_NAME\") | .id" | head -1)

if [ ! -z "$SA_ID" ] && [ "$SA_ID" != "null" ]; then
    echo "✅ Service Account '$SA_NAME' уже существует в каталоге: $SA_ID"
else
    echo "Создание нового Service Account..."
    CREATE_OUTPUT=$(yc iam service-account create --name $SA_NAME --folder-id $FOLDER_ID --description "Service account for events platform" --format json 2>&1)
    
    # Проверяем результат создания
    if echo "$CREATE_OUTPUT" | grep -q "AlreadyExists"; then
        echo "⚠️  Service Account с таким именем уже существует в другом каталоге"
        echo "Попытка найти Service Account в текущем каталоге..."
        # Проверяем список еще раз
        SA_LIST=$(yc iam service-account list --folder-id $FOLDER_ID --format json 2>/dev/null || echo "[]")
        SA_ID=$(echo "$SA_LIST" | jq -r ".[] | select(.name == \"$SA_NAME\") | .id" | head -1)
        
        if [ -z "$SA_ID" ] || [ "$SA_ID" = "null" ]; then
            # Создаем с уникальным именем
            SA_NAME_NEW="events-sa-$(date +%s | cut -c1-10)"
            echo "Создание Service Account с уникальным именем: $SA_NAME_NEW"
            CREATE_OUTPUT=$(yc iam service-account create --name $SA_NAME_NEW --folder-id $FOLDER_ID --description "Service account for events platform" --format json 2>&1)
            
            if echo "$CREATE_OUTPUT" | grep -q "AlreadyExists"; then
                echo "❌ Не удалось создать Service Account"
                echo "Попробуйте создать вручную:"
                echo "  yc iam service-account create --name events-sa-manual --folder-id $FOLDER_ID"
                exit 1
            else
                SA_ID=$(echo "$CREATE_OUTPUT" | jq -r '.id' 2>/dev/null)
                SA_NAME=$SA_NAME_NEW
            fi
        fi
    else
        # Успешное создание
        SA_ID=$(echo "$CREATE_OUTPUT" | jq -r '.id' 2>/dev/null)
    fi
    
    if [ ! -z "$SA_ID" ] && [ "$SA_ID" != "null" ]; then
        echo "✅ Service Account создан: $SA_ID (имя: $SA_NAME)"
    else
        echo "❌ Не удалось создать или найти Service Account"
        echo "Попробуйте создать вручную:"
        echo "  yc iam service-account create --name events-sa-manual --folder-id $FOLDER_ID"
        exit 1
    fi
fi

# Назначение роли (игнорируем ошибку, если роль уже назначена)
echo "Назначение роли editor..."
yc resource-manager folder add-access-binding $FOLDER_ID \
  --role editor \
  --subject serviceAccount:$SA_ID \
  2>&1 | grep -v "already exists" || echo "✅ Роль назначена или уже была назначена"

echo "✅ Service Account настроен"
echo ""

# Шаг 2: База данных
echo "📝 Шаг 2: Создание базы данных PostgreSQL..."
DB_NAME="events-db"
DB_USER="events_user"

# Генерация пароля
DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)

if yc managed-postgresql cluster get --name $DB_NAME --folder-id $FOLDER_ID &> /dev/null; then
    echo "⚠️  Кластер '$DB_NAME' уже существует"
    DB_HOST=$(yc managed-postgresql host list --cluster-name $DB_NAME --folder-id $FOLDER_ID --format json | jq -r '.[0].name')
else
    echo "Создание кластера PostgreSQL (это может занять несколько минут)..."
    yc managed-postgresql cluster create \
      --name $DB_NAME \
      --folder-id b1ggdi2brlp9vqlbg90a \
      --network-name default \
      --resource-preset s2.micro \
      --disk-type network-ssd \
      --disk-size 20 \
      --host zone-id=ru-central1-a,subnet-name=default-ru-central1-a \
      --user name=$DB_USER,password=$DB_PASSWORD \
      --database name=events_db,owner=$DB_USER \
      --async
    
    echo "⏳ Ожидание создания кластера..."
    sleep 30
    
    # Ожидание готовности
    while [ "$(yc managed-postgresql cluster get --name $DB_NAME --folder-id $FOLDER_ID --format json | jq -r '.status')" != "RUNNING" ]; do
        echo "⏳ Ожидание..."
        sleep 10
    done
    
    DB_HOST=$(yc managed-postgresql host list --cluster-name $DB_NAME --folder-id $FOLDER_ID --format json | jq -r '.[0].name')
    echo "✅ Кластер создан"
fi

DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/events_db"
echo "✅ База данных готова"
echo "   Host: $DB_HOST"
echo "   User: $DB_USER"
echo "   Password: $DB_PASSWORD (СОХРАНИТЕ ЭТОТ ПАРОЛЬ!)"
echo ""

# Шаг 3: Container Registry
echo "📝 Шаг 3: Создание Container Registry..."
REGISTRY_NAME="events-registry"

if yc container registry get --name $REGISTRY_NAME --folder-id $FOLDER_ID &> /dev/null; then
    echo "⚠️  Registry '$REGISTRY_NAME' уже существует"
    REGISTRY_ID=$(yc container registry get --name $REGISTRY_NAME --folder-id $FOLDER_ID --format json | jq -r '.id')
else
    yc container registry create --name $REGISTRY_NAME --folder-id $FOLDER_ID
    REGISTRY_ID=$(yc container registry get --name $REGISTRY_NAME --folder-id $FOLDER_ID --format json | jq -r '.id')
    echo "✅ Registry создан: $REGISTRY_ID"
fi

# Настройка Docker
yc container registry configure-docker --quiet || true
echo "✅ Registry настроен"
echo ""

# Шаг 4: Генерация JWT Secret
echo "📝 Шаг 4: Генерация секретов..."
JWT_SECRET=$(openssl rand -hex 32)
echo "✅ JWT Secret сгенерирован"
echo ""

# Сохранение конфигурации
CONFIG_FILE=".yandex-cloud-config"
cat > $CONFIG_FILE << EOF
# Yandex Cloud Configuration
# Generated: $(date)

FOLDER_ID=b1ggdi2brlp9vqlbg90a
SERVICE_ACCOUNT_ID=$SA_ID
DATABASE_URL=$DATABASE_URL
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=events_db
REGISTRY_ID=$REGISTRY_ID
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
EOF

echo "✅ Конфигурация сохранена в $CONFIG_FILE"
echo ""

# Вывод следующего шага
echo "=============================================="
echo "✅ Базовая настройка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1. Загрузите переменные:"
echo "   source $CONFIG_FILE"
echo ""
echo "2. Соберите и загрузите Docker образы:"
echo "   cd backend && docker build -t cr.yandex/\$REGISTRY_ID/events-backend:latest ."
echo "   docker push cr.yandex/\$REGISTRY_ID/events-backend:latest"
echo "   cd ../frontend && docker build -t cr.yandex/\$REGISTRY_ID/events-frontend:latest ."
echo "   docker push cr.yandex/\$REGISTRY_ID/events-frontend:latest"
echo ""
echo "3. Создайте Serverless Containers (см. YANDEX_CLOUD_SETUP.md)"
echo ""
echo "⚠️  ВАЖНО: Сохраните пароль БД: $DB_PASSWORD"
echo ""

