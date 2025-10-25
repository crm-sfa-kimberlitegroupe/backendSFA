#!/bin/bash
set -e

echo "🔧 Installation des dépendances..."
npm ci --include=dev

echo "🔧 Génération du client Prisma..."
npx prisma generate

echo "🔧 Build NestJS..."
npm run build

echo "✅ Vérification du build..."
if [ -f "dist/main.js" ]; then
  echo "✅ Build réussi - dist/main.js existe"
  ls -lh dist/
else
  echo "❌ ERREUR - dist/main.js n'existe pas"
  exit 1
fi
