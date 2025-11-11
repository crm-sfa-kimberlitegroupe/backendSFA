import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(' Seeding database...');

  // Create a default territory first
  const defaultTerritory = await prisma.territory.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: {
      code: 'DEFAULT',
      name: 'Default Territory',
      level: 'REGION',
    },
  });

  console.log(' Default territory created:', defaultTerritory.name);

  // Create a default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sfa.com' },
    update: {},
    create: {
      email: 'admin@sfa.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      territoryId: defaultTerritory.id,
    },
  });

  console.log(' Admin user created:', adminUser.email);

  // Create additional user: andrepierre585@gmail.com
  const hashedPasswordAndre = await bcrypt.hash('admin123', 10);

  const andreUser = await prisma.user.upsert({
    where: { email: 'andrepierre585@gmail.com' },
    update: {},
    create: {
      email: 'andrepierre585@gmail.com',
      passwordHash: hashedPasswordAndre,
      firstName: 'Andre',
      lastName: 'Pierre',
      role: 'ADMIN',
      status: 'ACTIVE',
      territoryId: defaultTerritory.id,
    },
  });
  console.log('✅ Andre user created:', andreUser.email);

  // Create rich territories (ZONES) first
  const plateau = await prisma.territory.upsert({
    where: { code: 'PLATEAU' },
    update: {},
    create: {
      code: 'PLATEAU',
      name: 'Plateau - Zone Commerciale',
      level: 'ZONE',

      // Informations géographiques
      regions: ['Abidjan'],
      communes: ['Plateau'],
      villes: ['Abidjan'],
      quartiers: ['Plateau Dokui'],
      codesPostaux: ['01 BP 1234'],
      lat: 5.3250,
      lng: -4.0200,

      // Informations démographiques
      population: 45000,
      superficie: 4.2,
      densitePopulation: 10714.29,

      // Informations commerciales
      potentielCommercial: 'TRES_FORT',
      categorieMarche: 'URBAIN',
      typeZone: 'COMMERCIAL',
      nombrePDVEstime: 150,
      tauxPenetration: 20.0,

      // Métadonnées
      notes:
        'Zone centrale d Abidjan, forte concentration de commerces et bureaux',
    },
  });

  const cocody = await prisma.territory.upsert({
    where: { code: 'COCODY' },
    update: {},
    create: {
      code: 'COCODY',
      name: 'Cocody - Zone Résidentielle',
      level: 'ZONE',

      // Informations géographiques
      regions: ['Abidjan'],
      communes: ['Cocody'],
      villes: ['Abidjan'],
      quartiers: ['Cocody 2 Plateaux'],
      codesPostaux: ['08 BP 2345'],
      lat: 5.3540,
      lng: -3.9860,

      // Informations démographiques
      population: 75000,
      superficie: 12.5,
      densitePopulation: 6000.0,

      // Informations commerciales
      potentielCommercial: 'FORT',
      categorieMarche: 'URBAIN',
      typeZone: 'MIXTE',
      nombrePDVEstime: 200,
      tauxPenetration: 15.0,

      // Métadonnées
      notes: 'Zone résidentielle haut standing avec centres commerciaux',
    },
  });

  const adjame = await prisma.territory.upsert({
    where: { code: 'ADJAME' },
    update: {},
    create: {
      code: 'ADJAME',
      name: 'Adjamé - Zone Populaire',
      level: 'ZONE',

      // Informations géographiques
      regions: ['Abidjan'],
      communes: ['Adjamé'],
      villes: ['Abidjan'],
      quartiers: ['Adjamé Marché'],
      codesPostaux: ['16 BP 3456'],
      lat: 5.3600,
      lng: -4.0300,

      // Informations démographiques
      population: 120000,
      superficie: 8.7,
      densitePopulation: 13793.10,

      // Informations commerciales
      potentielCommercial: 'MOYEN',
      categorieMarche: 'URBAIN',
      typeZone: 'COMMERCIAL',
      nombrePDVEstime: 300,
      tauxPenetration: 10.0,

      // Métadonnées
      notes:
        'Zone populaire avec grand marché, forte densité de commerces de proximité',
    },
  });

  console.log('✅ Rich territories created with detailed information');

  // Create sectors for each zone
  const plateauSector = await prisma.territory.upsert({
    where: { code: 'PLATEAU_SEC_1' },
    update: {},
    create: {
      code: 'PLATEAU_SEC_1',
      name: 'Plateau - Secteur Centre',
      level: 'SECTEUR',
      parentId: plateau.id,
    },
  });

  const cocodySector = await prisma.territory.upsert({
    where: { code: 'COCODY_SEC_1' },
    update: {},
    create: {
      code: 'COCODY_SEC_1',
      name: 'Cocody - Secteur Est',
      level: 'SECTEUR',
      parentId: cocody.id,
    },
  });

  const adjameSector = await prisma.territory.upsert({
    where: { code: 'ADJAME_SEC_1' },
    update: {},
    create: {
      code: 'ADJAME_SEC_1',
      name: 'Adjamé - Secteur Sud',
      level: 'SECTEUR',
      parentId: adjame.id,
    },
  });

  console.log('✅ Sectors created');

  // Create Manager (SUP) - assigned to Plateau to see all PDV
  const hashedPasswordManager = await bcrypt.hash('manager123', 10);
  const managerTest = await prisma.user.upsert({
    where: { email: 'manager@test.com' },
    update: {},
    create: {
      email: 'manager@test.com',
      passwordHash: hashedPasswordManager,
      firstName: 'Manager',
      lastName: 'Test',
      role: 'SUP',
      status: 'ACTIVE',
      territoryId: plateau.id, // Assigned to Plateau to see PDV
    },
  });
  console.log('✅ Manager created:', managerTest.email);

  // Create admins for each territory
  const hashedPasswordTest = await bcrypt.hash('admin123', 10);

  const adminPlateau = await prisma.user.upsert({
    where: { email: 'admin.plateau@test.com' },
    update: {},
    create: {
      email: 'admin.plateau@test.com',
      passwordHash: hashedPasswordTest,
      firstName: 'Admin',
      lastName: 'Plateau',
      role: 'ADMIN',
      status: 'ACTIVE',
      territoryId: plateau.id,
    },
  });

  const adminCocody = await prisma.user.upsert({
    where: { email: 'admin.cocody@test.com' },
    update: {},
    create: {
      email: 'admin.cocody@test.com',
      passwordHash: hashedPasswordTest,
      firstName: 'Admin',
      lastName: 'Cocody',
      role: 'ADMIN',
      status: 'ACTIVE',
      territoryId: cocody.id,
    },
  });

  const adminAdjame = await prisma.user.upsert({
    where: { email: 'admin.adjame@test.com' },
    update: {},
    create: {
      email: 'admin.adjame@test.com',
      passwordHash: hashedPasswordTest,
      firstName: 'Admin',
      lastName: 'Adjamé',
      role: 'ADMIN',
      status: 'ACTIVE',
      territoryId: adjame.id,
    },
  });

  console.log(
    '✅ Admins created:',
    adminPlateau.email,
    adminCocody.email,
    adminAdjame.email,
  );

  // Update territories to assign admins
  await prisma.territory.update({
    where: { id: plateau.id },
    data: { adminId: adminPlateau.id },
  });

  await prisma.territory.update({
    where: { id: cocody.id },
    data: { adminId: adminCocody.id },
  });

  await prisma.territory.update({
    where: { id: adjame.id },
    data: { adminId: adminAdjame.id },
  });

  console.log('✅ Admins assigned to their territories');

  // 3. REP (Vendeur) Users
  const hashedPasswordRep = await bcrypt.hash('vendeur123', 10);

  const rep1 = await prisma.user.upsert({
    where: { email: 'jean.kouassi@test.com' },
    update: {},
    create: {
      email: 'jean.kouassi@test.com',
      passwordHash: hashedPasswordRep,
      firstName: 'Jean',
      lastName: 'Kouassi',
      role: 'REP',
      status: 'ACTIVE',
      territoryId: plateau.id,
      assignedSectorId: plateauSector.id,
    },
  });
  console.log('✅ Vendeur 1 created:', rep1.email, '/ Password: vendeur123');

  const rep2 = await prisma.user.upsert({
    where: { email: 'marie.diallo@test.com' },
    update: {},
    create: {
      email: 'marie.diallo@test.com',
      passwordHash: hashedPasswordRep,
      firstName: 'Marie',
      lastName: 'Diallo',
      role: 'REP',
      status: 'ACTIVE',
      territoryId: cocody.id,
      assignedSectorId: cocodySector.id,
    },
  });
  console.log('✅ Vendeur 2 created:', rep2.email, '/ Password: vendeur123');

  const rep3 = await prisma.user.upsert({
    where: { email: 'paul.bamba@test.com' },
    update: {},
    create: {
      email: 'paul.bamba@test.com',
      passwordHash: hashedPasswordRep,
      firstName: 'Paul',
      lastName: 'Bamba',
      role: 'REP',
      status: 'ACTIVE',
      territoryId: adjame.id,
      assignedSectorId: adjameSector.id,
    },
  });
  console.log('✅ Vendeur 3 created:', rep3.email, '/ Password: vendeur123');

  // Create sample outlets and assign to sectors
  await prisma.outlet.upsert({
    where: { code: 'PLT-PDV-001' },
    update: {
      sectorId: plateauSector.id,
    },
    create: {
      code: 'PLT-PDV-001',
      name: 'Superette Plateau 1',
      channel: 'GT',
      segment: 'A',
      address: 'Plateau, Abidjan',
      territoryId: plateau.id,
      sectorId: plateauSector.id,
      status: 'APPROVED',
      lat: 5.325,
      lng: -4.02,
    },
  });

  await prisma.outlet.upsert({
    where: { code: 'PLT-PDV-002' },
    update: {
      sectorId: plateauSector.id,
    },
    create: {
      code: 'PLT-PDV-002',
      name: 'Boutique Plateau 2',
      channel: 'PROXI',
      segment: 'B',
      address: 'Plateau, Avenue 12',
      territoryId: plateau.id,
      sectorId: plateauSector.id,
      status: 'APPROVED',
      lat: 5.33,
      lng: -4.018,
    },
  });

  await prisma.outlet.upsert({
    where: { code: 'COC-PDV-001' },
    update: {
      sectorId: cocodySector.id,
    },
    create: {
      code: 'COC-PDV-001',
      name: 'Superette Cocody 1',
      channel: 'GT',
      segment: 'A',
      address: 'Cocody, Rue des Jardins',
      territoryId: cocody.id,
      sectorId: cocodySector.id,
      status: 'APPROVED',
      lat: 5.354,
      lng: -3.986,
    },
  });

  await prisma.outlet.upsert({
    where: { code: 'COC-PDV-002' },
    update: {
      sectorId: cocodySector.id,
    },
    create: {
      code: 'COC-PDV-002',
      name: 'Boutique Cocody 2',
      channel: 'PROXI',
      segment: 'B',
      address: 'Cocody, Rue du Lycée',
      territoryId: cocody.id,
      sectorId: cocodySector.id,
      status: 'APPROVED',
      lat: 5.348,
      lng: -3.99,
    },
  });

  await prisma.outlet.upsert({
    where: { code: 'ADJ-PDV-001' },
    update: {
      sectorId: adjameSector.id,
    },
    create: {
      code: 'ADJ-PDV-001',
      name: 'Superette Adjamé 1',
      channel: 'GT',
      segment: 'A',
      address: 'Adjamé, Rue du Marché',
      territoryId: adjame.id,
      sectorId: adjameSector.id,
      status: 'APPROVED',
      lat: 5.36,
      lng: -4.03,
    },
  });

  await prisma.outlet.upsert({
    where: { code: 'ADJ-PDV-002' },
    update: {
      sectorId: adjameSector.id,
    },
    create: {
      code: 'ADJ-PDV-002',
      name: 'Boutique Adjamé 2',
      channel: 'PROXI',
      segment: 'B',
      address: 'Adjamé, Avenue 4',
      territoryId: adjame.id,
      sectorId: adjameSector.id,
      status: 'APPROVED',
      lat: 5.358,
      lng: -4.028,
    },
  });

  console.log('✅ Sample outlets seeded & linked to sectors');

  // ====== AJOUT PDV POUR SAMUEL AVEC INFOS GÉOGRAPHIQUES ======
  // Récupérer le territoire de Samuel
  const samuelUser = await prisma.user.findUnique({
    where: { email: 'samuel@gmail.com' },
    include: { territory: true }
  });

  if (samuelUser) {
    console.log(
      '🔍 Samuel trouvé, création de PDV avec infos géographiques...',
    );
    // PDV 1 pour Samuel
    await prisma.outlet.upsert({
      where: { code: 'SAM-PDV-001' },
      update: {},
      create: {
        code: 'SAM-PDV-001',
        name: 'Boutique Koumassi Centre',
        channel: 'GT',
        segment: 'A',
        address: 'Koumassi, Centre Commercial',
        territoryId: samuelUser.territoryId,
        proposedBy: samuelUser.id,
        status: 'PENDING',
      },
    });

    // PDV 2 pour Samuel
    await prisma.outlet.upsert({
      where: { code: 'SAM-PDV-002' },
      update: {},
      create: {
        code: 'SAM-PDV-002',
        name: 'Supermarché Mocho',
        channel: 'MT',
        segment: 'A',
        address: 'Mocho, Avenue Principale',
        territoryId: samuelUser.territoryId,
        proposedBy: samuelUser.id,
        status: 'APPROVED',
      },
    });

    // PDV 3 pour Samuel
    await prisma.outlet.upsert({
      where: { code: 'SAM-PDV-003' },
      update: {},
      create: {
        code: 'SAM-PDV-003',
        name: 'Épicerie des Lagunes',
        channel: 'PROXI',
        segment: 'B',
        address: 'Des Lagunes, Quartier résidentiel',
        territoryId: samuelUser.territoryId,
        proposedBy: samuelUser.id,
        status: 'APPROVED',
      },
    });

    console.log('✅ 3 PDV créés pour Samuel avec infos géographiques!');
  } else {
    console.log('⚠️ Samuel non trouvé, PDV non créés');
  }

  console.log('\n🎉 Seeding completed!');
  console.log('\n📝 Test Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 ADMIN PLATEAU:  admin.plateau@test.com / admin123');
  console.log('👤 ADMIN COCODY:   admin.cocody@test.com / admin123');
  console.log('👤 ADMIN ADJAMÉ:   admin.adjame@test.com / admin123');
  console.log('👤 MANAGER:        manager@test.com / manager123');
  console.log('👤 VENDEUR PLATEAU: jean.kouassi@test.com / vendeur123');
  console.log('👤 VENDEUR COCODY:  marie.diallo@test.com / vendeur123');
  console.log('👤 VENDEUR ADJAMÉ:  paul.bamba@test.com / vendeur123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error(' Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
