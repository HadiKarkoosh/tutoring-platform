import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { User } from './entities/user.entity';
import { Subject } from './entities/subject.entity';
import { AvailabilitySlot } from './entities/availability-slot.entity';
import { Booking } from './entities/booking.entity';
import { Review } from './entities/review.entity';
import { AuthModule } from './auth/auth.module';
import { TutorsModule } from './tutors/tutors.module';
import { BookingsModule } from './bookings/bookings.module';
import { SubjectsModule } from './subjects/subjects.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH ?? 'tutoring.sqlite',
      entities: [User, Subject, AvailabilitySlot, Booking, Review],
      synchronize: true,
    }),
    AuthModule,
    TutorsModule,
    BookingsModule,
    SubjectsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
