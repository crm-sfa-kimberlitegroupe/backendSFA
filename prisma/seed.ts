import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sfa.com' },
    update: {},
    create: {
      email: 'admin@sfa.com',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Add more seed data here as needed
  // Example: territories, outlets, SKUs, etc.

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {await prisma.$disconnect(); });
