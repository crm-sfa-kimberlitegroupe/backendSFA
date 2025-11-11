import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Création d\'un utilisateur de test...');

  // Hash du mot de passe
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Créer un utilisateur SUP (Manager)
  const sup = await prisma.user.upsert({
    where: { email: 'sup@sfa.com' },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: 'sup@sfa.com',
      passwordHash: hashedPassword,
      firstName: 'Manager',
      lastName: 'SUP',
      phone: '+237600000001',
      role: 'SUP',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Utilisateur SUP créé:', sup.email);

  // Créer un utilisateur ADMIN
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sfa.com' },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: 'admin@sfa.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'TEST',
      phone: '+237600000002',
      role: 'ADMIN',
      status: 'ACTIVE',
      managerId: sup.id,
    },
  });

  console.log('✅ Utilisateur ADMIN créé:', admin.email);

  // Créer un utilisateur REP (Vendeur)
  const rep = await prisma.user.upsert({
    where: { email: 'rep@sfa.com' },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: 'rep@sfa.com',
      passwordHash: hashedPassword,
      firstName: 'Vendeur',
      lastName: 'REP',
      phone: '+237600000003',
      role: 'REP',
      status: 'ACTIVE',
      managerId: admin.id,
    },
  });

  console.log('✅ Utilisateur REP créé:', rep.email);

  console.log('\n📋 Identifiants de connexion:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUP   : sup@sfa.com   / password123');
  console.log('ADMIN : admin@sfa.com / password123');
  console.log('REP   : rep@sfa.com   / password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
