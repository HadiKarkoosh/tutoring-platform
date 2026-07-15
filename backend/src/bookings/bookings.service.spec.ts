import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { AvailabilitySlot } from '../entities/availability-slot.entity';
import { Booking } from '../entities/booking.entity';
import { User } from '../entities/user.entity';
import { testTypeOrmModule } from '../test-utils/test-db';
import { BookingsModule } from './bookings.module';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  let moduleRef: TestingModule;
  let service: BookingsService;
  let users: Repository<User>;
  let slots: Repository<AvailabilitySlot>;
  let bookings: Repository<Booking>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        testTypeOrmModule(),
        TypeOrmModule.forFeature([User, AvailabilitySlot]),
        BookingsModule,
      ],
    }).compile();
    service = moduleRef.get(BookingsService);
    users = moduleRef.get(getRepositoryToken(User));
    slots = moduleRef.get(getRepositoryToken(AvailabilitySlot));
    bookings = moduleRef.get(getRepositoryToken(Booking));
  });

  afterAll(() => moduleRef.close());

  async function makeTutorAndSlot() {
    const tutor = await users.save(
      users.create({
        name: 'Tutor',
        email: `tutor-${Date.now()}-${Math.random()}@test.com`,
        passwordHash: 'x',
        role: 'tutor',
      }),
    );
    const slot = await slots.save(
      slots.create({
        tutor,
        startTime: new Date(Date.now() + 3600_000),
        endTime: new Date(Date.now() + 7200_000),
      }),
    );
    return { tutor, slot };
  }

  async function makeStudent(tag: string) {
    return users.save(
      users.create({
        name: `Student ${tag}`,
        email: `student-${tag}-${Date.now()}-${Math.random()}@test.com`,
        passwordHash: 'x',
        role: 'student',
      }),
    );
  }

  it('lets exactly one of two concurrent bookings on the same slot succeed', async () => {
    const { slot } = await makeTutorAndSlot();
    const s1 = await makeStudent('a');
    const s2 = await makeStudent('b');

    const results = await Promise.allSettled([
      service.create(s1.id, slot.id),
      service.create(s2.id, slot.id),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const rows = await bookings.find({ where: { slot: { id: slot.id } } });
    expect(rows).toHaveLength(1);

    const refreshedSlot = await slots.findOne({ where: { id: slot.id } });
    expect(refreshedSlot?.isBooked).toBe(true);
  });

  it('rejects booking a slot that is already booked', async () => {
    const { slot } = await makeTutorAndSlot();
    const s1 = await makeStudent('c');
    const s2 = await makeStudent('d');

    await service.create(s1.id, slot.id);
    await expect(service.create(s2.id, slot.id)).rejects.toThrow();
  });

  it('rejects a tutor booking their own slot', async () => {
    const { tutor, slot } = await makeTutorAndSlot();
    await expect(service.create(tutor.id, slot.id)).rejects.toThrow();
  });

  it('frees the slot again when a booking is cancelled', async () => {
    const { slot } = await makeTutorAndSlot();
    const student = await makeStudent('e');

    const booking = await service.create(student.id, slot.id);
    await service.cancel(student.id, booking!.id);

    const refreshedSlot = await slots.findOne({ where: { id: slot.id } });
    expect(refreshedSlot?.isBooked).toBe(false);
  });
});
