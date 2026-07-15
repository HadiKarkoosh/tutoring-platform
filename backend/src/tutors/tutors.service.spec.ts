import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Subject } from '../entities/subject.entity';
import { User } from '../entities/user.entity';
import { testTypeOrmModule } from '../test-utils/test-db';
import { TutorsModule } from './tutors.module';
import { TutorsService } from './tutors.service';

describe('TutorsService', () => {
  let moduleRef: TestingModule;
  let service: TutorsService;
  let users: Repository<User>;
  let subjects: Repository<Subject>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [testTypeOrmModule(), TutorsModule],
    }).compile();
    service = moduleRef.get(TutorsService);
    users = moduleRef.get(getRepositoryToken(User));
    subjects = moduleRef.get(getRepositoryToken(Subject));
  });

  afterAll(() => moduleRef.close());

  async function makeTutor(name: string) {
    return users.save(
      users.create({
        name,
        email: `${name}-${Date.now()}-${Math.random()}@test.com`,
        passwordHash: 'x',
        role: 'tutor',
      }),
    );
  }

  it('rejects a slot that overlaps an existing one', async () => {
    const tutor = await makeTutor('محمد');
    const base = Date.now() + 24 * 3600_000;
    await service.addSlot(
      tutor.id,
      new Date(base).toISOString(),
      new Date(base + 3600_000).toISOString(),
    );

    await expect(
      service.addSlot(
        tutor.id,
        new Date(base + 1800_000).toISOString(),
        new Date(base + 5400_000).toISOString(),
      ),
    ).rejects.toThrow();
  });

  it('allows back-to-back non-overlapping slots', async () => {
    const tutor = await makeTutor('سارة');
    const base = Date.now() + 24 * 3600_000;
    await service.addSlot(
      tutor.id,
      new Date(base).toISOString(),
      new Date(base + 3600_000).toISOString(),
    );
    await expect(
      service.addSlot(
        tutor.id,
        new Date(base + 3600_000).toISOString(),
        new Date(base + 7200_000).toISOString(),
      ),
    ).resolves.toBeDefined();
  });

  it('rejects adding a slot in the past', async () => {
    const tutor = await makeTutor('فهد');
    await expect(
      service.addSlot(
        tutor.id,
        new Date(Date.now() - 3600_000).toISOString(),
        new Date(Date.now() + 3600_000).toISOString(),
      ),
    ).rejects.toThrow();
  });

  it('finds tutors by a partial, case-sensitive-agnostic name match', async () => {
    await makeTutor('نور الهدى');
    await makeTutor('كريم');
    const results = await service.findAll(undefined, 'نور');
    expect(results.some((t) => t.name === 'نور الهدى')).toBe(true);
    expect(results.some((t) => t.name === 'كريم')).toBe(false);
  });

  it('updates a tutor profile (bio, hourly rate, subjects)', async () => {
    const tutor = await makeTutor('ياسمين');
    const subject = await subjects.save(subjects.create({ name: `مادة-${Date.now()}` }));

    const updated = await service.updateProfile(tutor.id, {
      bio: 'خبرة 3 سنوات',
      hourlyRate: 40,
      subjectIds: [subject.id],
    });

    expect(updated.bio).toBe('خبرة 3 سنوات');
    expect(updated.hourlyRate).toBe(40);
    expect(updated.subjects.map((s) => s.id)).toContain(subject.id);
  });
});
