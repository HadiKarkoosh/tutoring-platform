import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { AvailabilitySlot } from '../entities/availability-slot.entity';
import { Booking } from '../entities/booking.entity';
import { Review } from '../entities/review.entity';
import { Subject } from '../entities/subject.entity';
import { User } from '../entities/user.entity';

export interface UpdateProfileInput {
  bio?: string;
  hourlyRate?: number;
  subjectIds?: number[];
}

@Injectable()
export class TutorsService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(AvailabilitySlot)
    private slots: Repository<AvailabilitySlot>,
    @InjectRepository(Booking) private bookings: Repository<Booking>,
    @InjectRepository(Review) private reviews: Repository<Review>,
    @InjectRepository(Subject) private subjects: Repository<Subject>,
  ) {}

  async findAll(subject?: string, search?: string) {
    const qb = this.users
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.subjects', 's')
      .where('u.role = :role', { role: 'tutor' });
    if (subject) {
      qb.andWhere(
        'u.id IN (SELECT usu.userId FROM user_subjects_subject usu ' +
          'JOIN subject sub ON sub.id = usu.subjectId WHERE sub.name = :subject)',
        { subject },
      );
    }
    if (search) {
      qb.andWhere('u.name LIKE :search', { search: `%${search}%` });
    }
    const tutors = await qb.orderBy('u.name', 'ASC').getMany();
    const ratings = await this.avgRatingsFor(tutors.map((t) => t.id));
    return tutors.map((t) => this.publicProfile(t, ratings[t.id] ?? null));
  }

  async findOne(id: string) {
    const tutor = await this.users.findOne({
      where: { id, role: 'tutor' },
      relations: { subjects: true },
    });
    if (!tutor) throw new NotFoundException('المدرّس غير موجود');
    const slots = await this.slots.find({
      where: { tutor: { id }, isBooked: false },
      order: { startTime: 'ASC' },
    });
    const now = new Date();
    const reviews = await this.reviews.find({
      where: { tutor: { id } },
      order: { createdAt: 'DESC' },
    });
    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;
    return {
      ...this.publicProfile(tutor, avgRating),
      reviewCount: reviews.length,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        student: { id: r.student.id, name: r.student.name },
      })),
      availableSlots: slots.filter((s) => new Date(s.startTime) > now),
    };
  }

  async updateProfile(tutorId: string, dto: UpdateProfileInput) {
    const tutor = await this.users.findOne({ where: { id: tutorId } });
    if (!tutor) throw new NotFoundException('المدرّس غير موجود');
    if (dto.bio !== undefined) tutor.bio = dto.bio || null;
    if (dto.hourlyRate !== undefined) tutor.hourlyRate = dto.hourlyRate;
    if (dto.subjectIds !== undefined) {
      tutor.subjects = dto.subjectIds.length
        ? await this.subjects.findBy({ id: In(dto.subjectIds) })
        : [];
    }
    await this.users.save(tutor);
    const full = await this.users.findOne({
      where: { id: tutorId },
      relations: { subjects: true },
    });
    return this.publicProfile(full!);
  }

  async addSlot(tutorId: string, startTime: string, endTime: string) {
    const { start, end } = this.validateSlotTimes(startTime, endTime);
    await this.assertNoOverlap(tutorId, start, end);
    return this.slots.save(
      this.slots.create({
        tutor: { id: tutorId } as User,
        startTime: start,
        endTime: end,
      }),
    );
  }

  async updateSlot(
    tutorId: string,
    slotId: string,
    startTime: string,
    endTime: string,
  ) {
    const slot = await this.slots.findOne({
      where: { id: slotId },
      relations: { tutor: true },
    });
    if (!slot) throw new NotFoundException('الموعد غير موجود');
    if (slot.tutor.id !== tutorId)
      throw new ForbiddenException('لا تملك صلاحية تعديل هذا الموعد');
    if (slot.isBooked)
      throw new BadRequestException('لا يمكن تعديل موعد محجوز');

    const { start, end } = this.validateSlotTimes(startTime, endTime);
    await this.assertNoOverlap(tutorId, start, end, slotId);
    slot.startTime = start;
    slot.endTime = end;
    return this.slots.save(slot);
  }

  async removeSlot(tutorId: string, slotId: string) {
    const slot = await this.slots.findOne({
      where: { id: slotId },
      relations: { tutor: true },
    });
    if (!slot) throw new NotFoundException('الموعد غير موجود');
    if (slot.tutor.id !== tutorId)
      throw new ForbiddenException('لا تملك صلاحية حذف هذا الموعد');
    if (slot.isBooked)
      throw new BadRequestException('لا يمكن حذف موعد محجوز');
    await this.slots.delete(slotId);
    return { deleted: true };
  }

  async mySlots(tutorId: string) {
    return this.slots.find({
      where: { tutor: { id: tutorId } },
      order: { startTime: 'ASC' },
    });
  }

  async myBookings(tutorId: string) {
    return this.bookings
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.slot', 'slot')
      .leftJoinAndSelect('b.student', 'student')
      .where('slot.tutorId = :tutorId', { tutorId })
      .andWhere("b.status = 'confirmed'")
      .orderBy('slot.startTime', 'ASC')
      .getMany()
      .then((rows) =>
        rows.map((b) => ({
          id: b.id,
          slot: b.slot,
          status: b.status,
          createdAt: b.createdAt,
          student: {
            id: b.student.id,
            name: b.student.name,
            email: b.student.email,
          },
        })),
      );
  }

  private validateSlotTimes(startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(+start) || isNaN(+end))
      throw new BadRequestException('صيغة التاريخ غير صحيحة');
    if (end <= start)
      throw new BadRequestException('وقت النهاية يجب أن يكون بعد وقت البداية');
    if (start < new Date())
      throw new BadRequestException('لا يمكن إضافة موعد في الماضي');
    return { start, end };
  }

  private async assertNoOverlap(
    tutorId: string,
    start: Date,
    end: Date,
    excludeSlotId?: string,
  ) {
    // Overlap: existing.start < new.end AND existing.end > new.start
    const overlap = await this.slots.findOne({
      where: {
        tutor: { id: tutorId },
        startTime: LessThan(end),
        endTime: MoreThan(start),
        ...(excludeSlotId ? { id: Not(excludeSlotId) } : {}),
      },
    });
    if (overlap)
      throw new BadRequestException('الموعد يتعارض مع موعد آخر لديك');
  }

  private async avgRatingsFor(tutorIds: string[]) {
    if (tutorIds.length === 0) return {} as Record<string, number | null>;
    const rows = await this.reviews
      .createQueryBuilder('r')
      .select('r.tutorId', 'tutorId')
      .addSelect('AVG(r.rating)', 'avg')
      .where('r.tutorId IN (:...tutorIds)', { tutorIds })
      .groupBy('r.tutorId')
      .getRawMany<{ tutorId: string; avg: string }>();
    const map: Record<string, number | null> = {};
    for (const row of rows) map[row.tutorId] = Number(row.avg);
    return map;
  }

  private publicProfile(t: User, avgRating: number | null = null) {
    return {
      id: t.id,
      name: t.name,
      bio: t.bio,
      hourlyRate: t.hourlyRate,
      subjects: t.subjects ?? [],
      avgRating,
    };
  }
}
