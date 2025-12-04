import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MerchandisingService } from './merchandising.service';
import {
  CreateMerchandisingDto,
  UpdateMerchandisingDto,
  AddPhotosDto,
} from './dto/merchandising.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('merchandising')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MerchandisingController {
  constructor(
    private readonly merchandisingService: MerchandisingService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Creer un nouveau merchandising
   */
  @Post()
  @Roles('REP')
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateMerchandisingDto,
  ) {
    const merchCheck = await this.merchandisingService.create(
      req.user.userId,
      dto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Merchandising cree avec succes',
      data: merchCheck,
    };
  }

  /**
   * Recuperer un merchandising par ID
   */
  @Get(':id')
  @Roles('REP', 'ADMIN', 'SUP')
  async findById(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const merchCheck = await this.merchandisingService.findById(
      id,
      req.user.userId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Merchandising recupere avec succes',
      data: merchCheck,
    };
  }

  /**
   * Recuperer les merchandisings d'une visite
   */
  @Get('visit/:visitId')
  @Roles('REP', 'ADMIN', 'SUP')
  async findByVisit(
    @Request() req: AuthenticatedRequest,
    @Param('visitId') visitId: string,
  ) {
    const merchChecks = await this.merchandisingService.findByVisit(
      visitId,
      req.user.userId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Merchandisings recuperes avec succes',
      data: merchChecks,
    };
  }

  /**
   * Mettre a jour un merchandising
   */
  @Put(':id')
  @Roles('REP')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateMerchandisingDto,
  ) {
    const merchCheck = await this.merchandisingService.update(
      id,
      req.user.userId,
      dto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Merchandising mis a jour avec succes',
      data: merchCheck,
    };
  }

  /**
   * Ajouter des photos a un merchandising
   */
  @Post(':id/photos')
  @Roles('REP')
  async addPhotos(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: AddPhotosDto,
  ) {
    const merchCheck = await this.merchandisingService.addPhotos(
      id,
      req.user.userId,
      dto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Photos ajoutees avec succes',
      data: merchCheck,
    };
  }

  /**
   * Uploader une photo pour le merchandising
   */
  @Post('upload-photo')
  @Roles('REP')
  @UseInterceptors(FileInterceptor('image'))
  async uploadPhoto(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Aucun fichier fourni',
        data: null,
      };
    }

    console.log('[MerchandisingController] Upload photo par:', req.user.userId);

    const imageUrl = await this.cloudinaryService.uploadImage(
      file,
      'sfa-merchandising',
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Photo uploadee avec succes',
      data: {
        imageUrl,
        fileKey: imageUrl,
      },
    };
  }

  /**
   * Supprimer une photo
   */
  @Delete(':merchCheckId/photos/:photoId')
  @Roles('REP')
  async deletePhoto(
    @Request() req: AuthenticatedRequest,
    @Param('merchCheckId') merchCheckId: string,
    @Param('photoId') photoId: string,
  ) {
    const result = await this.merchandisingService.deletePhoto(
      merchCheckId,
      photoId,
      req.user.userId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  /**
   * Supprimer un merchandising
   */
  @Delete(':id')
  @Roles('REP')
  async delete(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const result = await this.merchandisingService.delete(id, req.user.userId);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  /**
   * Statistiques de merchandising
   */
  @Get('stats/me')
  @Roles('REP')
  async getMyStats(
    @Request() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.merchandisingService.getStats(
      req.user.userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Statistiques recuperees avec succes',
      data: stats,
    };
  }

  /**
   * Recuperer les SKUs disponibles pour le merchandising
   */
  @Get('skus/available')
  @Roles('REP')
  async getAvailableSKUs(@Request() req: AuthenticatedRequest) {
    const skus = await this.merchandisingService.getAvailableSKUs(
      req.user.userId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'SKUs disponibles recuperes avec succes',
      data: skus,
    };
  }
}
