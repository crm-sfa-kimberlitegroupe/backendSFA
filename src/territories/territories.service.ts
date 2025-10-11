import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface Territory {
  id: string;
  name: string;
  code: string;
}

@Injectable()
export class TerritoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Territory[]> {
    const territories = await this.prisma.territory.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return territories;
  }
}
