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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user?: {
    userId?: string;
    role?: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Récupérer tous les utilisateurs (filtrés selon le rôle)
   */
  @Get()
  async findAll(@Request() req: RequestWithUser) {
    const currentUserId = req.user?.userId;
    const users = await this.usersService.findAll(currentUserId);
    return {
      success: true,
      data: users,
      message: 'Utilisateurs récupérés avec succès',
    };
  }

  /**
   * Récupérer les managers (SUP et ADMIN)
   */
  @Get('managers/list')
  async getManagers() {
    const managers = await this.usersService.getManagers();
    return {
      success: true,
      data: managers,
      message: 'Managers récupérés avec succès',
    };
  }

  /**
   * Récupérer tous les vendeurs et administrateurs pour la page Team
   */
  @Get('team/all')
  async getTeamMembers() {
    const teamMembers = await this.usersService.getTeamMembers();
    return {
      success: true,
      data: teamMembers,
      message: "Membres de l'équipe récupérés avec succès",
    };
  }

  /**
   * Récupérer un utilisateur par ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findByIdWithRelations(id);
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
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() req: RequestWithUser,
  ) {
    const creatorId = req.user?.userId;
    const user = await this.usersService.create(createUserDto, creatorId);
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

  /**
   * Upload de photo de profil
   */
  @Post(':id/upload-photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérifier le type de fichier
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Type de fichier non supporté. Utilisez JPG, PNG ou WEBP',
      );
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Le fichier est trop volumineux (max 5MB)');
    }

    const photoUrl = await this.usersService.uploadProfilePhoto(id, file);
    return {
      success: true,
      data: { photoUrl },
      message: 'Photo de profil mise à jour avec succès',
    };
  }
}
