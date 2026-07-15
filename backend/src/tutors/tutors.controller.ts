import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsDateString } from 'class-validator';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { TutorsService } from './tutors.service';

class CreateSlotDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}

@Controller('tutors')
export class TutorsController {
  constructor(private tutors: TutorsService) {}

  // --- Tutor self-management (must come before :id routes) ---

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
  findAll(@Query('subject') subject?: string) {
    return this.tutors.findAll(subject);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tutors.findOne(id);
  }
}
