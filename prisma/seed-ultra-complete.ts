import { PrismaClient } from '@prisma/client';
import { cleanDatabase, createManager, createTerritories, createAdmins, createSectors } from './seed-complete';
import { createVendeurs, createOutlets, createProductHierarchy, createRoutes, createVendorStock } from './seed-complete-part2';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 DÉMARRAGE DU SEEDING ULTRA COMPLET DE LA BASE DE DONNÉES');
    console.log('=' .repeat(60));
    console.log('');
    
    // 1. Nettoyer la base de données
    await cleanDatabase();
    
    // 2. Créer le manager (SUP)
    const manager = await createManager();
    
    // 3. Créer 4 territoires (zones)
    const territories = await createTerritories(manager);
    
    // 4. Créer 4 admins (1 par territoire)
    const admins = await createAdmins(territories, manager);
    
    // 5. Créer 16 secteurs (4 par territoire)
    const sectors = await createSectors(territories, admins);
    
    // 6. Créer 16 vendeurs (1 par secteur)
    const vendeurs = await createVendeurs(sectors, admins, territories);
    
    // 7. Créer 240 PDV (15 par vendeur)
    const outlets = await createOutlets(vendeurs, sectors, territories, admins);
    
    // 8. Créer la hiérarchie produits complète
    const skus = await createProductHierarchy();
    
    // 9. Créer les routes pour chaque vendeur
    const routes = await createRoutes(vendeurs, outlets);
    
    // 10. Attribuer du stock initial aux vendeurs
    await createVendorStock(vendeurs, skus);
    
    // Résumé final
    console.log('\n');
    console.log('=' .repeat(60));
    console.log('🎉 SEEDING ULTRA COMPLET TERMINÉ AVEC SUCCÈS !');
    console.log('=' .repeat(60));
    console.log('\n📊 RÉSUMÉ DES DONNÉES CRÉÉES :');
    console.log('--------------------------------');
    console.log(`✅ 1 Manager (SUP)`);
    console.log(`✅ 4 Territoires (Zones)`);
    console.log(`✅ 4 Admins`);
    console.log(`✅ 16 Secteurs`);
    console.log(`✅ 16 Vendeurs (REP)`);
    console.log(`✅ 240 Points de vente`);
    console.log(`✅ ${skus.length} SKUs avec hiérarchie complète`);
    console.log(`✅ ${routes.length} Routes planifiées`);
    console.log(`✅ Stock initial attribué`);
    
    console.log('\n📧 COMPTES DE TEST :');
    console.log('--------------------------------');
    console.log('MANAGER (SUP):');
    console.log('  Email: directeur.general@sfa-ci.com');
    console.log('  Mot de passe: Manager@2024!');
    console.log('');
    console.log('ADMINS:');
    for (let i = 0; i < 4; i++) {
      console.log(`  Admin ${i + 1}: admin.${territories[i].code.toLowerCase()}@sfa-ci.com / Admin@2024!`);
    }
    console.log('');
    console.log('VENDEURS (REP):');
    console.log('  Tous les vendeurs utilisent le mot de passe: Vendeur@2024!');
    console.log('  Format email: prenom.nom@sfa-ci.com');
    
    console.log('\n🌍 ZONES GÉOGRAPHIQUES :');
    console.log('--------------------------------');
    for (const territory of territories) {
      console.log(`  ${territory.name}: ${territory.communes.join(', ')}`);
    }
    
    console.log('\n✨ La base de données est maintenant prête pour l\'utilisation !');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeding
main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e);
    process.exit(1);
  });
