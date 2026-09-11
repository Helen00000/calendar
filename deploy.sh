#!/bin/bash
# ============================================================
# 🚀 deploy.sh — Лёгкий деплой (только dist + data)
# Запускается НА СЕРВЕРЕ
# ============================================================

set -e

APP_NAME="content-hub"
APP_DIR="/var/www/$APP_NAME"
PORT=3000

echo "📦 [1/5] Подготовка директории..."
mkdir -p "$APP_DIR/dist" "$APP_DIR/data"

echo "📦 [2/5] Установка production-зависимостей..."
cd "$APP_DIR"
npm install --omit=dev --ignore-scripts

echo "🔐 [3/5] Проверка .env..."
if [ ! -f "$APP_DIR/.env" ]; then
  echo "⚠️  Создайте $APP_DIR/.env с GEMINI_API_KEY и APP_PASSWORD!"
  exit 1
fi

echo "💾 [4/6] Бэкап данных..."
if [ -f "$APP_DIR/data/content-db.json" ]; then
  cp "$APP_DIR/data/content-db.json" "$APP_DIR/data/content-db.backup.json"
  echo "   ✅ Бэкап создан: data/content-db.backup.json"
fi

echo "🔄 [5/6] Перезапуск..."
if command -v pm2 &> /dev/null; then
  pm2 restart "$APP_NAME" 2>/dev/null || \
    pm2 start "$APP_DIR/dist/server.cjs" --name "$APP_NAME" --env production
  pm2 save
else
  npm install -g pm2
  pm2 start "$APP_DIR/dist/server.cjs" --name "$APP_NAME" --env production
  pm2 save
  pm2 startup
fi

echo "✅ [6/6] Готово! http://$(hostname -I | awk '{print $1}'):$PORT"