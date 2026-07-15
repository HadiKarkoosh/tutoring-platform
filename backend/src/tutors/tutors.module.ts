import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilitySlot } from '../entities/availability-slot.entity';
import { Booking } from '../entities/booking.entity';
import { User } from '../entities/user.entity';
import { TutorsController } from './tutors.controller';
import { TutorsService } from './tutors.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, AvailabilitySlot, Booking])],
  controllers: [TutorsController],
  providers: [TutorsService],
})
export class TutorsModule {}
