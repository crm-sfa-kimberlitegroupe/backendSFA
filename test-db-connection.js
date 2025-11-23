const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    return;
  }

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('🔌 Attempting to connect to database...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    console.log('🔍 Testing simple query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query successful:', result);
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n🔧 Troubleshooting P1001 error:');
      console.log('1. Check if database server is running');
      console.log('2. Verify connection string format');
      console.log('3. Check network connectivity');
      console.log('4. Verify database credentials');
    }
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testConnection().catch(console.error);
