import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { TutorsService } from './tutors.service';

class CreateSlotDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  subjectIds?: number[];
}

@Controller('tutors')
export class TutorsController {
  constructor(private tutors: TutorsService) {}

  // --- Tutor self-management (must come before :id routes) ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tutor')
  @Patch('me')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.tutors.updateProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tutor')
  @Get('me/slots')
  mySlots(@Req() req: any) {
    return this.tutors.mySlots(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tutor')
  @Post('me/slots')
  addSlot(@Req() req: any, @Body() dto: CreateSlotDto) {
    return this.tutors.addSlot(req.user.id, dto.startTime, dto.endTime);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tutor')
  @Patch('me/slots/:slotId')
  updateSlot(
    @Req() req: any,
    @Param('slotId') slotId: string,
    @Body() dto: CreateSlotDto,
  ) {
    return this.tutors.updateSlot(
      req.user.id,
      slotId,
      dto.startTime,
      dto.endTime,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tutor')
  @Delete('me/slots/:slotId')
  removeSlot(@Req() req: any, @Param('slotId') slotId: string) {
    return this.tutors.removeSlot(req.user.id, slotId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tutor')
  @Get('me/bookings')
  myBookings(@Req() req: any) {
    return this.tutors.myBookings(req.user.id);
  }

  // --- Public ---

  @Get()
  findAll(@Query('subject') subject?: string, @Query('search') search?: string) {
    return this.tutors.findAll(subject, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tutors.findOne(id);
  }
}
