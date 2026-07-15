import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../entities/booking.entity';
import { Review } from '../entities/review.entity';
import { Subject } from '../entities/subject.entity';
import { User } from '../entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Booking, Subject, Review])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
