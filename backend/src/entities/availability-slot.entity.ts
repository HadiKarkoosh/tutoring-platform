import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
@Index(['tutor', 'startTime'])
export class AvailabilitySlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  tutor: User;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  /**
   * Denormalized flag updated atomically inside the booking transaction
   * (UPDATE ... WHERE isBooked = 0) to prevent double-booking races.
   */
  @Column({ default: false })
  isBooked: boolean;
}
