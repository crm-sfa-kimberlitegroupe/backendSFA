#!/bin/bash
set -e

echo "🔧 Installation des dépendances..."
npm ci --include=dev

echo "📦 Vérification @nestjs/cli..."
if ! npm list @nestjs/cli > /dev/null 2>&1; then
  echo "❌ @nestjs/cli non installé, installation forcée..."
  npm install --save-dev @nestjs/cli
fi

echo "🔧 Génération du client Prisma..."
npx prisma generate

echo "🔧 Nettoyage du dossier dist..."
rm -rf dist

echo "🔧 Build NestJS avec npx..."
npx nest build

echo "📂 Contenu du répertoire après build:"
ls -la

echo "✅ Vérification du build..."
if [ -f "dist/main.js" ]; then
  echo "✅ Build réussi - dist/main.js existe"
  ls -lh dist/
else
  echo "❌ ERREUR - dist/main.js n'existe pas"
  echo "Contenu du dossier dist:"
  ls -la dist/ 2>/dev/null || echo "Le dossier dist/ n'existe pas"
  exit 1
fi
