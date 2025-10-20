import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OutletsService } from './outlets.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OutletStatusEnum } from '@prisma/client';

interface RequestWithUser {
  user?: {
    userId?: string;
    role?: string;
  };
}

@Controller('outlets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  @Post()
  create(
    @Body() createOutletDto: CreateOutletDto,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user?.userId;
    return this.outletsService.create(createOutletDto, userId);
  }

  @Get()
  findAll(
    @Query('status') status?: OutletStatusEnum,
    @Query('territoryId') territoryId?: string,
    @Query('channel') channel?: string,
    @Query('proposedBy') proposedBy?: string,
  ) {
    return this.outletsService.findAll({
      status,
      territoryId,
      channel,
      proposedBy,
    });
  }

  @Get('stats')
  getStats(
    @Query('territoryId') territoryId?: string,
    @Query('proposedBy') proposedBy?: string,
  ) {
    return this.outletsService.getStats({ territoryId, proposedBy });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.outletsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOutletDto: UpdateOutletDto) {
    return this.outletsService.update(id, updateOutletDto);
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'SUP')
  approve(@Param('id') id: string, @Request() req: RequestWithUser) {
    const validatorId = req.user?.userId;
    return this.outletsService.approve(id, validatorId);
  }

  @Patch(':id/reject')
  @Roles('ADMIN', 'SUP')
  reject(
    @Param('id') id: string,
    @Body('reason') reason?: string,
    @Request() req?: RequestWithUser,
  ) {
    const validatorId = req?.user?.userId;
    return this.outletsService.reject(id, reason, validatorId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.outletsService.remove(id);
  }
}
