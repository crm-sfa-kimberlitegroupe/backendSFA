import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Récupérer tous les utilisateurs
   */
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      success: true,
      data: users,
      message: 'Utilisateurs récupérés avec succès',
    };
  }

  /**
   * Récupérer un utilisateur par ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return {
      success: true,
      data: user,
      message: 'Utilisateur récupéré avec succès',
    };
  }

  /**
   * Créer un nouvel utilisateur
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès',
    };
  }

  /**
   * Mettre à jour un utilisateur
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      success: true,
      data: user,
      message: 'Utilisateur mis à jour avec succès',
    };
  }

  /**
   * Supprimer un utilisateur
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return {
      success: true,
      message: 'Utilisateur supprimé avec succès',
    };
  }

  /**
   * Suspendre/Activer un utilisateur
   */
  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    const user = await this.usersService.toggleStatus(id);
    return {
      success: true,
      data: user,
      message: `Utilisateur ${user.status === 'ACTIVE' ? 'activé' : 'suspendu'} avec succès`,
    };
  }

  /**
   * Récupérer les performances d'un utilisateur
   */
  @Get(':id/performance')
  async getPerformance(@Param('id') id: string) {
    const performance = await this.usersService.getUserPerformance(id);
    return {
      success: true,
      data: performance,
      message: 'Performances récupérées avec succès',
    };
  }
}
