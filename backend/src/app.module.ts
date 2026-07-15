import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Subject } from './entities/subject.entity';
import { AvailabilitySlot } from './entities/availability-slot.entity';
import { Booking } from './entities/booking.entity';
import { AuthModule } from './auth/auth.module';
import { TutorsModule } from './tutors/tutors.module';
import { BookingsModule } from './bookings/bookings.module';
import { SubjectsModule } from './subjects/subjects.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH ?? 'tutoring.sqlite',
      entities: [User, Subject, AvailabilitySlot, Booking],
      synchronize: true,
    }),
    AuthModule,
    TutorsModule,
    BookingsModule,
    SubjectsModule,
  ],
})
export class AppModule {}
