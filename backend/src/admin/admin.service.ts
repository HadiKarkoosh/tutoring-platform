import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Review } from '../entities/review.entity';
import { Subject } from '../entities/subject.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Booking) private bookings: Repository<Booking>,
    @InjectRepository(Subject) private subjects: Repository<Subject>,
    @InjectRepository(Review) private reviews: Repository<Review>,
  ) {}

  async stats() {
    const [totalTutors, totalStudents, totalAdmins, totalBookings, totalSubjects, totalReviews] =
      await Promise.all([
        this.users.count({ where: { role: 'tutor' } }),
        this.users.count({ where: { role: 'student' } }),
        this.users.count({ where: { role: 'admin' } }),
        this.bookings.count(),
        this.subjects.count(),
        this.reviews.count(),
      ]);
    return { totalTutors, totalStudents, totalAdmins, totalBookings, totalSubjects, totalReviews };
  }

  async users_() {
    const rows = await this.users.find({
      relations: { subjects: true },
      order: { role: 'ASC', name: 'ASC' },
    });
    return rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      hourlyRate: u.hourlyRate,
      subjects: u.subjects ?? [],
    }));
  }

  /** Every tutor's hourly rate, grouped with a per-subject average. */
  async pricing() {
    const tutors = await this.users.find({
      where: { role: 'tutor' },
      relations: { subjects: true },
      order: { hourlyRate: 'DESC' },
    });

    const bySubject = new Map<string, number[]>();
    for (const t of tutors) {
      if (t.hourlyRate == null) continue;
      for (const s of t.subjects) {
        const list = bySubject.get(s.name) ?? [];
        list.push(t.hourlyRate);
        bySubject.set(s.name, list);
      }
    }

    return {
      tutors: tutors.map((t) => ({
        id: t.id,
        name: t.name,
        hourlyRate: t.hourlyRate,
        subjects: t.subjects.map((s) => s.name),
      })),
      averageBySubject: Array.from(bySubject.entries()).map(([subject, rates]) => ({
        subject,
        average: Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) / 100,
        count: rates.length,
      })),
    };
  }

  async bookings_() {
    const rows = await this.bookings.find({
      relations: { slot: { tutor: true }, student: true },
      order: { createdAt: 'DESC' },
    });
    return rows.map((b) => ({
      id: b.id,
      status: b.status,
      createdAt: b.createdAt,
      startTime: b.slot.startTime,
      endTime: b.slot.endTime,
      tutor: { id: b.slot.tutor.id, name: b.slot.tutor.name },
      student: { id: b.student.id, name: b.student.name },
    }));
  }
}
