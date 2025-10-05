#!/bin/bash
# Script de migration et démarrage pour Render

echo " Génération du client Prisma..."
npx prisma generate

echo " Application des migrations de base de données..."
npx prisma migrate deploy

echo " Démarrage de l'application..."
npm run start:prod
