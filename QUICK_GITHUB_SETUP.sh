#!/bin/bash

# Скрипт для быстрой настройки GitHub репозитория
# Использование: ./QUICK_GITHUB_SETUP.sh YOUR_USERNAME REPO_NAME

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Использование: ./QUICK_GITHUB_SETUP.sh YOUR_USERNAME REPO_NAME"
    echo "Пример: ./QUICK_GITHUB_SETUP.sh vidmich events-platform"
    exit 1
fi

USERNAME=$1
REPO_NAME=$2
REPO_URL="https://github.com/${USERNAME}/${REPO_NAME}.git"

echo "🚀 Настройка GitHub репозитория..."
echo "Username: $USERNAME"
echo "Repository: $REPO_NAME"
echo ""

# Проверка, инициализирован ли git
if [ ! -d ".git" ]; then
    echo "📦 Инициализация Git..."
    git init
else
    echo "✅ Git уже инициализирован"
fi

# Проверка remote
if git remote get-url origin &>/dev/null; then
    echo "⚠️  Remote 'origin' уже настроен"
    read -p "Заменить? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin $REPO_URL
        echo "✅ Remote обновлен"
    fi
else
    echo "🔗 Добавление remote..."
    git remote add origin $REPO_URL
    echo "✅ Remote добавлен"
fi

# Добавление файлов
echo "📝 Добавление файлов..."
git add .

# Проверка, есть ли изменения для коммита
if git diff --staged --quiet; then
    echo "ℹ️  Нет изменений для коммита"
else
    echo "💾 Создание коммита..."
    git commit -m "Initial commit: Events platform with modern design"
    echo "✅ Коммит создан"
fi

# Переименование ветки в main
echo "🌿 Настройка ветки main..."
git branch -M main 2>/dev/null || echo "Ветка уже main"

# Инструкции
echo ""
echo "✅ Готово! Теперь выполните следующие шаги:"
echo ""
echo "1. Создайте репозиторий на GitHub:"
echo "   https://github.com/new"
echo "   Название: $REPO_NAME"
echo "   НЕ добавляйте README, .gitignore или лицензию"
echo ""
echo "2. После создания репозитория выполните:"
echo "   git push -u origin main"
echo ""
echo "3. Или выполните сейчас (если репозиторий уже создан):"
read -p "Отправить код на GitHub сейчас? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Отправка кода на GitHub..."
    git push -u origin main
    echo ""
    echo "🎉 Готово! Код отправлен на GitHub"
    echo "🌐 Репозиторий: $REPO_URL"
else
    echo "ℹ️  Выполните 'git push -u origin main' когда будете готовы"
fi

echo ""
echo "📖 Подробная инструкция: см. GITHUB_SETUP.md"

