import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { BookingsService } from './bookings.service';

class CreateBookingDto {
  @IsUUID()
  slotId: string;
}

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Roles('student')
  @Post()
  create(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookings.create(req.user.id, dto.slotId);
  }

  @Roles('student')
  @Get('me')
  findMine(@Req() req: any) {
    return this.bookings.findMine(req.user.id);
  }

  @Roles('student')
  @Delete(':id')
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.bookings.cancel(req.user.id, id);
  }
}
