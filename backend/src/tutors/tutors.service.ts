import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { AvailabilitySlot } from '../entities/availability-slot.entity';
import { Booking } from '../entities/booking.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class TutorsService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(AvailabilitySlot)
    private slots: Repository<AvailabilitySlot>,
    @InjectRepository(Booking) private bookings: Repository<Booking>,
  ) {}

  async findAll(subject?: string) {
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
    const tutors = await qb.orderBy('u.name', 'ASC').getMany();
    return tutors.map((t) => this.publicProfile(t));
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
    return {
      ...this.publicProfile(tutor),
      availableSlots: slots.filter((s) => new Date(s.startTime) > now),
    };
  }

  async addSlot(tutorId: string, startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(+start) || isNaN(+end))
      throw new BadRequestException('صيغة التاريخ غير صحيحة');
    if (end <= start)
      throw new BadRequestException('وقت النهاية يجب أن يكون بعد وقت البداية');
    if (start < new Date())
      throw new BadRequestException('لا يمكن إضافة موعد في الماضي');

    // Overlap: existing.start < new.end AND existing.end > new.start
    const overlap = await this.slots.findOne({
      where: {
        tutor: { id: tutorId },
        startTime: LessThan(end),
        endTime: MoreThan(start),
      },
    });
    if (overlap)
      throw new BadRequestException('الموعد يتعارض مع موعد آخر لديك');

    return this.slots.save(
      this.slots.create({
        tutor: { id: tutorId } as User,
        startTime: start,
        endTime: end,
      }),
    );
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

  private publicProfile(t: User) {
    return {
      id: t.id,
      name: t.name,
      bio: t.bio,
      hourlyRate: t.hourlyRate,
      subjects: t.subjects ?? [],
    };
  }
}
