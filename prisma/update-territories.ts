import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Mise à jour des territoires avec les données enrichies...');

  // Mettre à jour Plateau
  await prisma.territory.update({
    where: { code: 'PLATEAU' },
    data: {
      name: 'Plateau - Zone Commerciale',
      level: 'ZONE',
      region: 'Abidjan',
      commune: 'Plateau',
      ville: 'Abidjan',
      quartier: 'Plateau Dokui',
      codePostal: '01 BP 1234',
      lat: 5.3250,
      lng: -4.0200,
      population: 45000,
      superficie: 4.2,
      densitePopulation: 10714.29,
      potentielCommercial: 'TRES_FORT',
      categorieMarche: 'URBAIN',
      typeZone: 'COMMERCIAL',
      nombrePDVEstime: 150,
      tauxPenetration: 20.0,
      notes: 'Zone centrale d\'Abidjan, forte concentration de commerces et bureaux',
    },
  });
  console.log('✅ Plateau mis à jour');

  // Mettre à jour Cocody
  await prisma.territory.update({
    where: { code: 'COCODY' },
    data: {
      name: 'Cocody - Zone Résidentielle',
      level: 'ZONE',
      region: 'Abidjan',
      commune: 'Cocody',
      ville: 'Abidjan',
      quartier: 'Cocody 2 Plateaux',
      codePostal: '08 BP 2345',
      lat: 5.3540,
      lng: -3.9860,
      population: 75000,
      superficie: 12.5,
      densitePopulation: 6000.0,
      potentielCommercial: 'FORT',
      categorieMarche: 'URBAIN',
      typeZone: 'MIXTE',
      nombrePDVEstime: 200,
      tauxPenetration: 15.0,
      notes: 'Zone résidentielle haut standing avec centres commerciaux',
    },
  });
  console.log('✅ Cocody mis à jour');

  // Mettre à jour Adjamé
  await prisma.territory.update({
    where: { code: 'ADJAME' },
    data: {
      name: 'Adjamé - Zone Populaire',
      level: 'ZONE',
      region: 'Abidjan',
      commune: 'Adjamé',
      ville: 'Abidjan',
      quartier: 'Adjamé Marché',
      codePostal: '16 BP 3456',
      lat: 5.3600,
      lng: -4.0300,
      population: 120000,
      superficie: 8.7,
      densitePopulation: 13793.10,
      potentielCommercial: 'MOYEN',
      categorieMarche: 'URBAIN',
      typeZone: 'COMMERCIAL',
      nombrePDVEstime: 300,
      tauxPenetration: 10.0,
      notes: 'Zone populaire avec grand marché, forte densité de commerces de proximité',
    },
  });
  console.log('✅ Adjamé mis à jour');

  console.log('\n🎉 Tous les territoires ont été enrichis avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
