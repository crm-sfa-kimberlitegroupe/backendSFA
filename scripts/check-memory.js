#!/usr/bin/env node

/**
 * Script pour vérifier la consommation mémoire de l'application
 * Usage: node scripts/check-memory.js
 */

const used = process.memoryUsage();
const MB = 1024 * 1024;

console.log('\n📊 Consommation mémoire actuelle:\n');

for (let key in used) {
  const value = Math.round((used[key] / MB) * 100) / 100;
  const status = value > 400 ? '🔴' : value > 300 ? '🟡' : '🟢';
  console.log(`${status} ${key}: ${value} MB`);
}

const heapUsed = Math.round((used.heapUsed / MB) * 100) / 100;
const heapTotal = Math.round((used.heapTotal / MB) * 100) / 100;
const percentage = Math.round((heapUsed / heapTotal) * 100);

console.log(`\n📈 Utilisation du heap: ${percentage}%`);

if (heapUsed > 400) {
  console.log('\n⚠️  ATTENTION: Consommation mémoire élevée (>400 MB)');
  console.log('Recommandations:');
  console.log('  1. Vérifiez les connexions DB ouvertes');
  console.log('  2. Vérifiez les fuites mémoire');
  console.log('  3. Considérez un upgrade vers plan Starter (1GB RAM)');
} else if (heapUsed > 300) {
  console.log('\n🟡 Consommation mémoire modérée (300-400 MB)');
  console.log('Application stable mais proche de la limite');
} else {
  console.log('\n✅ Consommation mémoire optimale (<300 MB)');
}

console.log('\n');
