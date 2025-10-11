import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      // Optimisation: Réduire les logs en production
      log: process.env.NODE_ENV === 'production' 
        ? ['error'] 
        : ['query', 'error', 'warn'],
      
      // Optimisation: Configuration du connection pool
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.$connect();
    
    // Optimisation: Timeout pour les requêtes longues
    await this.$executeRaw`SET statement_timeout = '10s'`;
  }

  async onModuleDestroy() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.$disconnect();
  }
  
  // Optimisation: Méthode pour nettoyer les connexions inactives
  async cleanupConnections() {
    await this.$disconnect();
    await this.$connect();
  }
}
