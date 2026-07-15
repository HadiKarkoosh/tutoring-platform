import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilitySlot } from '../entities/availability-slot.entity';
import { Booking } from '../entities/booking.entity';
import { Review } from '../entities/review.entity';
import { Subject } from '../entities/subject.entity';
import { User } from '../entities/user.entity';
import { TutorsController } from './tutors.controller';
import { TutorsService } from './tutors.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AvailabilitySlot, Booking, Review, Subject]),
  ],
  controllers: [TutorsController],
  providers: [TutorsService],
})
export class TutorsModule {}
