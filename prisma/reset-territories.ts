import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Suppression des anciens territoires...');
  
  // Supprimer les territoires ZONE et SECTEUR (garder DEFAULT)
  await prisma.territory.deleteMany({
    where: {
      code: {
        in: ['PLATEAU', 'COCODY', 'ADJAME', 'PLATEAU_SEC_1', 'COCODY_SEC_1', 'ADJAME_SEC_1']
      }
    }
  });
  
  console.log('✅ Territoires supprimés avec succès');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
