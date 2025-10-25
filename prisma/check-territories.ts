import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des territoires dans la base de données...\n');

  const territories = await prisma.territory.findMany({
    where: {
      code: {
        in: ['PLATEAU', 'COCODY', 'ADJAME'],
      },
    },
  });

  territories.forEach((t) => {
    console.log(`\n📍 ${t.name} (${t.code})`);
    console.log(`   Région: ${t.region || 'NON DÉFINI'}`);
    console.log(`   Commune: ${t.commune || 'NON DÉFINI'}`);
    console.log(`   Population: ${t.population || 'NON DÉFINI'}`);
    console.log(`   Superficie: ${t.superficie || 'NON DÉFINI'} km²`);
    console.log(`   Potentiel: ${t.potentielCommercial || 'NON DÉFINI'}`);
    console.log(`   Notes: ${t.notes || 'NON DÉFINI'}`);
  });

  console.log(`\n\n✅ Total: ${territories.length} territoires`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
