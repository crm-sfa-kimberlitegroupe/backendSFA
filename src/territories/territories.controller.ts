import { Controller, Get, UseGuards } from '@nestjs/common';
import { TerritoriesService } from './territories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('territories')
@UseGuards(JwtAuthGuard)
export class TerritoriesController {
  constructor(private readonly territoriesService: TerritoriesService) {}

  /**
   * Récupérer tous les territoires
   */
  @Get()
  async findAll() {
    const territories = await this.territoriesService.findAll();
    return {
      success: true,
      data: territories,
      message: 'Territoires récupérés avec succès',
    };
  }
}
