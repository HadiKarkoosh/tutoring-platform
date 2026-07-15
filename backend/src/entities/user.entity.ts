import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Subject } from './subject.entity';

export type UserRole = 'tutor' | 'student';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'text' })
  role: UserRole;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'int', nullable: true })
  hourlyRate: number | null;

  @ManyToMany(() => Subject, { eager: true })
  @JoinTable()
  subjects: Subject[];
}
