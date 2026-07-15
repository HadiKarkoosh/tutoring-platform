import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AvailabilitySlot } from './availability-slot.entity';
import { User } from './user.entity';

export type BookingStatus = 'confirmed' | 'cancelled';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique join column = hard DB-level guarantee that a slot
   * can never have two bookings, even under concurrent requests.
   */
  @OneToOne(() => AvailabilitySlot, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  slot: AvailabilitySlot;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  student: User;

  @Column({ type: 'text', default: 'confirmed' })
  status: BookingStatus;

  @CreateDateColumn()
  createdAt: Date;
}
