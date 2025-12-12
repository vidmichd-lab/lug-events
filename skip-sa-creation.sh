#!/bin/bash

# Скрипт для пропуска создания Service Account и использования существующего
# Использование: ./skip-sa-creation.sh

set -e

FOLDER_ID="b1ggdi2brlp9vqlbg90a"
EXISTING_SA_ID="ajeuaiav6i7hoi6tlqbh"

echo "📁 Используется каталог: $FOLDER_ID"
echo "🔑 Используется существующий Service Account: $EXISTING_SA_ID"

# Установка каталога по умолчанию
yc config set folder-id $FOLDER_ID

# Проверка существования Service Account
if yc iam service-account get --id $EXISTING_SA_ID &> /dev/null; then
    echo "✅ Service Account найден"
    SA_ID=$EXISTING_SA_ID
else
    echo "❌ Service Account не найден"
    exit 1
fi

# Назначение роли (игнорируем ошибку, если роль уже назначена)
echo "Назначение роли editor для каталога $FOLDER_ID..."
yc resource-manager folder add-access-binding $FOLDER_ID \
  --role editor \
  --subject serviceAccount:$SA_ID \
  2>&1 | grep -v "already exists" || echo "✅ Роль назначена или уже была назначена"

echo ""
echo "✅ Service Account настроен: $SA_ID"
echo ""
echo "Теперь можно продолжить с остальными шагами:"
echo "export SERVICE_ACCOUNT_ID=$SA_ID"
echo "export FOLDER_ID=$FOLDER_ID"
echo ""
echo "Или запустите setup-yandex-cloud.sh, но он попытается создать новый SA"

