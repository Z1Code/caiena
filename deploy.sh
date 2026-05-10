#!/bin/bash
# Deploy script for Caiena Beauty Nails
# Usage: bash deploy.sh

set -e

VPS="root@178.156.176.15"
SSH_PORT=443
SSH="ssh -p $SSH_PORT -o StrictHostKeyChecking=no"
SCP="scp -P $SSH_PORT -o StrictHostKeyChecking=no"
APP_DIR="/var/www/caiena"
APP_NAME="caiena"

echo "=== Building Next.js ==="
npm run build

echo "=== Creating app directory on VPS ==="
$SSH $VPS "mkdir -p $APP_DIR/.next $APP_DIR/public"

echo "=== Syncing standalone build ==="
tar -czf - .next/standalone | $SSH $VPS "cd $APP_DIR && tar -xzf -"

echo "=== Syncing static files ==="
tar -czf - .next/static | $SSH $VPS "cd $APP_DIR && tar -xzf -"

echo "=== Syncing public ==="
tar -czf - public | $SSH $VPS "cd $APP_DIR && tar -xzf -"

echo "=== Syncing PM2 config ==="
$SCP ecosystem.config.js $VPS:$APP_DIR/

echo "=== Restarting PM2 ==="
$SSH $VPS "cd $APP_DIR && pm2 delete $APP_NAME 2>/dev/null; pm2 start ecosystem.config.js && pm2 save"

echo "=== Done! ==="
echo "Site live at https://caienanails.com"
