#!/bin/bash
# ============================================================
# 📤 upload.sh — Собрать локально и залить ТОЛЬКО нужное
# Запускается на ВАШЕЙ машине
#
# Использование:
#   ./upload.sh          — только код (данные НЕ трогает)
#   ./upload.sh --data   — код + данные (перезапишет content-db.json!)
# ============================================================

set -e

# ⚙️ НАСТРОЙКИ — поменяйте под себя:
SERVER_USER="root"
SERVER_IP="5.188.21.94"    # ← IP вашего сервера
REMOTE_DIR="/var/www/content-hub"

# Проверяем флаг --data
UPLOAD_DATA=false
if [ "$1" = "--data" ]; then
  UPLOAD_DATA=true
  echo "⚠️  Режим: КОД + ДАННЫЕ (content-db.json будет перезаписан!)"
  read -p "   Продолжить? (y/N): " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ Отменено."
    exit 1
  fi
else
  echo "ℹ️  Режим: только КОД (данные на сервере не трогаем)"
  echo "   Чтобы загрузить и данные: ./upload.sh --data"
fi

echo "🔨 [1/4] Сборка проекта..."
npm run build

echo "📤 [2/4] Загрузка файлов на сервер..."
# Создаём структуру на сервере
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_DIR/dist $REMOTE_DIR/data"

# Копируем код
scp -r dist/* "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/dist/"
scp package.json "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"
scp package-lock.json "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/" 2>/dev/null || true

# Копируем данные ТОЛЬКО если указан --data
if [ "$UPLOAD_DATA" = true ]; then
  if [ -f "data/content-db.json" ]; then
    echo "💾 [3/4] Загрузка данных (content-db.json)..."
    # Сначала делаем бэкап на сервере
    ssh "$SERVER_USER@$SERVER_IP" "test -f $REMOTE_DIR/data/content-db.json && cp $REMOTE_DIR/data/content-db.json $REMOTE_DIR/data/content-db.backup.json || true"
    scp data/content-db.json "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/data/content-db.json"
    echo "   ✅ Данные загружены (бэкап сохранён как content-db.backup.json)"
  else
    echo "   ⚠️ Файл data/content-db.json не найден локально, пропускаем"
  fi
else
  echo "⏭️  [3/4] Данные пропущены (нет флага --data)"
fi

echo "🚀 [4/4] Запуск деплоя на сервере..."
ssh "$SERVER_USER@$SERVER_IP" "cd $REMOTE_DIR && bash deploy.sh"

echo "✅ Деплой завершён!"