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

  // Create territories for test users
  const plateau = await prisma.territory.upsert({
    where: { code: 'PLATEAU' },
    update: {},
    create: {
      code: 'PLATEAU',
      name: 'Plateau',
      level: 'ZONE',
    },
  });

  const cocody = await prisma.territory.upsert({
    where: { code: 'COCODY' },
    update: {},
    create: {
      code: 'COCODY',
      name: 'Cocody',
      level: 'ZONE',
    },
  });

  const adjame = await prisma.territory.upsert({
    where: { code: 'ADJAME' },
    update: {},
    create: {
      code: 'ADJAME',
      name: 'Adjamé',
      level: 'ZONE',
    },
  });

  console.log('✅ Territories created');

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
      territoryId: defaultTerritory.id,
    },
  });

  console.log('✅ Admins created:', adminPlateau.email, adminCocody.email, adminAdjame.email);
  console.log('✅ Manager created:', managerTest.email);

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
    },
  });
  console.log('✅ Vendeur 3 created:', rep3.email, '/ Password: vendeur123');

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
