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

  console.log(' Andre user created:', andreUser.email);

  // Add more seed data here as needed
  // Example: territories, outlets, SKUs, etc.

  console.log(' Seeding completed!');
}

main()
  .catch((e) => {
    console.error(' Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
