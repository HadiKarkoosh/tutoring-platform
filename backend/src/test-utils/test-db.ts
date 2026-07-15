import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilitySlot } from '../entities/availability-slot.entity';
import { Booking } from '../entities/booking.entity';
import { Review } from '../entities/review.entity';
import { Subject } from '../entities/subject.entity';
import { User } from '../entities/user.entity';

/** Fresh in-memory SQLite DataSource for isolated service-level tests. */
export function testTypeOrmModule() {
  return TypeOrmModule.forRoot({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [User, Subject, AvailabilitySlot, Booking, Review],
    synchronize: true,
  });
}
