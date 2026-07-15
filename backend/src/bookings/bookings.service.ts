import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AvailabilitySlot } from '../entities/availability-slot.entity';
import { Booking } from '../entities/booking.entity';
import { Mutex } from '../common/mutex';
import { User } from '../entities/user.entity';

@Injectable()
export class BookingsService {
  /**
   * better-sqlite3 is a single synchronous connection, so two overlapping
   * `dataSource.transaction()` calls both issue BEGIN on it and the second
   * one throws instead of queueing. This mutex serializes access to that one
   * connection so the atomic conditional UPDATE below is what actually
   * decides the winner, instead of both requests crashing.
   */
  private writeLock = new Mutex();

  constructor(
    @InjectRepository(Booking) private bookings: Repository<Booking>,
    private dataSource: DataSource,
  ) {}

  /**
   * Race-safe booking:
   * 1. Everything runs in one transaction.
   * 2. The slot is claimed with an atomic conditional UPDATE
   *    (SET isBooked = 1 WHERE id = :id AND isBooked = 0).
   *    Of two concurrent requests, exactly one affects a row; the other gets 409.
   * 3. The unique JoinColumn on Booking.slot is a second, DB-level safety net.
   */
  async create(studentId: string, slotId: string) {
    return this.writeLock.runExclusive(() => this.doCreate(studentId, slotId));
  }

  private async doCreate(studentId: string, slotId: string) {
    return this.dataSource.transaction(async (manager) => {
      const slot = await manager.findOne(AvailabilitySlot, {
        where: { id: slotId },
        relations: { tutor: true },
      });
      if (!slot) throw new NotFoundException('الموعد غير موجود');
      if (slot.tutor.id === studentId)
        throw new BadRequestException('لا يمكنك حجز موعدك الخاص');
      if (new Date(slot.startTime) <= new Date())
        throw new BadRequestException('لا يمكن حجز موعد في الماضي');

      const claim = await manager
        .createQueryBuilder()
        .update(AvailabilitySlot)
        .set({ isBooked: true })
        .where('id = :slotId AND isBooked = :free', { slotId, free: false })
        .execute();

      if (!claim.affected) {
        throw new ConflictException('هذا الموعد محجوز بالفعل');
      }

      const booking = manager.create(Booking, {
        slot: { id: slotId } as AvailabilitySlot,
        student: { id: studentId } as User,
        status: 'confirmed',
      });
      const saved = await manager.save(booking);
      return manager.findOne(Booking, { where: { id: saved.id } });
    });
  }

  async findMine(studentId: string) {
    return this.bookings.find({
      where: { student: { id: studentId } },
      order: { createdAt: 'DESC' },
    });
  }

  /** Cancel a booking and free its slot (transactional). */
  async cancel(studentId: string, bookingId: string) {
    return this.writeLock.runExclusive(() => this.doCancel(studentId, bookingId));
  }

  private async doCancel(studentId: string, bookingId: string) {
    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, {
        where: { id: bookingId },
        relations: { student: true, slot: true },
      });
      if (!booking) throw new NotFoundException('الحجز غير موجود');
      if (booking.student.id !== studentId)
        throw new ForbiddenException('لا تملك صلاحية إلغاء هذا الحجز');
      if (booking.status === 'cancelled')
        throw new BadRequestException('الحجز ملغى بالفعل');

      // Delete the booking (frees the unique slot reference) and re-open the slot.
      await manager.delete(Booking, booking.id);
      await manager.update(AvailabilitySlot, booking.slot.id, {
        isBooked: false,
      });
      return { cancelled: true };
    });
  }
}
