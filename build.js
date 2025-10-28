#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 === DÉBUT DU BUILD ===\n');

function run(command, description) {
  console.log(`\n📌 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        NPM_CONFIG_INCLUDE: 'dev'
      } 
    });
    console.log(`✅ ${description} - Succès`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - Échec`);
    throw error;
  }
}

try {
  // Étape 1: Installation des dépendances
  run('npm ci --include=dev', 'Installation des dépendances');

  // Étape 2: Génération Prisma
  run('npx prisma generate', 'Génération du client Prisma');

  // Étape 3: Nettoyage
  console.log('\n🧹 Nettoyage du dossier dist...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('✅ Dossier dist nettoyé');
  }

  // Étape 4: Build TypeScript
  run('npx nest build', 'Build NestJS (TypeScript → JavaScript)');
  
  // Étape 4.5: Vérification intermédiaire
  console.log('\n🔍 Vérification du build TypeScript...');
  if (!fs.existsSync('dist')) {
    throw new Error('Le dossier dist n\'a pas été créé par nest build');
  }

  // Étape 5: Vérification
  console.log('\n📂 Vérification du build...');
  const distPath = path.join(process.cwd(), 'dist', 'main.js');
  
  console.log(`🔍 Recherche de: ${distPath}`);
  
  if (fs.existsSync(distPath)) {
    const stats = fs.statSync(distPath);
    console.log('✅ LE BUILD A RÉUSSI !');
    console.log(`   📄 Fichier: dist/main.js`);
    console.log(`   📦 Taille: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Lister le contenu de dist/
    console.log('\n📁 Contenu de dist/:');
    const files = fs.readdirSync('dist');
    files.forEach(file => {
      const filePath = path.join('dist', file);
      const fileStats = fs.statSync(filePath);
      const size = fileStats.isDirectory() ? 'DIR' : `${(fileStats.size / 1024).toFixed(2)} KB`;
      console.log(`   - ${file} (${size})`);
    });
    
    console.log('\n🎉 BUILD COMPLÉTÉ AVEC SUCCÈS !\n');
    process.exit(0);
  } else {
    console.error('\n❌ ERREUR CRITIQUE: dist/main.js N\'EXISTE PAS');
    console.error('📂 Contenu du répertoire actuel:');
    
    try {
      const currentFiles = fs.readdirSync('.');
      currentFiles.forEach(file => {
        const stats = fs.statSync(file);
        const type = stats.isDirectory() ? 'DIR' : 'FILE';
        const size = stats.isDirectory() ? '' : ` (${(stats.size / 1024).toFixed(2)} KB)`;
        console.error(`   - ${file} [${type}]${size}`);
      });
    } catch (err) {
      console.error('   Erreur lors de la lecture du répertoire:', err.message);
    }
    
    if (fs.existsSync('dist')) {
      console.error('\n📂 Contenu de dist/:');
      try {
        const distFiles = fs.readdirSync('dist');
        distFiles.forEach(file => {
          const filePath = path.join('dist', file);
          const stats = fs.statSync(filePath);
          const type = stats.isDirectory() ? 'DIR' : 'FILE';
          const size = stats.isDirectory() ? '' : ` (${(stats.size / 1024).toFixed(2)} KB)`;
          console.error(`   - ${file} [${type}]${size}`);
        });
      } catch (err) {
        console.error('   Erreur lors de la lecture de dist/:', err.message);
      }
    } else {
      console.error('\n❌ Le dossier dist/ n\'a pas été créé');
    }
    
    process.exit(1);
  }
} catch (error) {
  console.error('\n💥 ERREUR DURANT LE BUILD');
  console.error(error.message);
  process.exit(1);
}
