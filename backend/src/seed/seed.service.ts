import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AvailabilitySlot } from '../entities/availability-slot.entity';
import { Subject } from '../entities/subject.entity';
import { User } from '../entities/user.entity';

interface SeedTutor {
  name: string;
  email: string;
  password: string;
  subjectName: string;
  bio: string;
  hourlyRate: number;
}

const NAMED_TUTORS: SeedTutor[] = [
  {
    name: 'Hadi Karkoosh',
    email: 'hadi@gmail.com',
    password: 'password1',
    subjectName: 'برمجة',
    bio: 'مهندس برمجيات بخبرة عملية بتطوير الواجهات والباك اند — بشرح المفاهيم بطريقة مبسّطة وعملية.',
    hourlyRate: 25,
  },
  {
    name: 'Ali Kheder',
    email: 'ali@gmail.com',
    password: 'password2',
    subjectName: 'رياضيات',
    bio: 'مدرّس رياضيات بخبرة تدريس المرحلة الثانوية والجامعية — أسلوب واضح ومباشر بالشرح.',
    hourlyRate: 15,
  },
  {
    name: 'Karam Al-Hajjah',
    email: 'karam@gmail.com',
    password: 'password3',
    subjectName: 'فيزياء',
    bio: 'مدرّس فيزياء متخصص، بيربط المادة بأمثلة من الواقع لتسهيل الفهم.',
    hourlyRate: 18,
  },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Subject) private subjects: Repository<Subject>,
    @InjectRepository(AvailabilitySlot)
    private slots: Repository<AvailabilitySlot>,
  ) {}

  async onModuleInit() {
    const existing = await this.users.count();
    if (existing > 0) return;

    this.logger.log('Seeding demo tutors, students, and slots...');

    for (const t of NAMED_TUTORS) {
      const subject = await this.subjects.findOne({
        where: { name: t.subjectName },
      });
      const tutor = await this.users.save(
        this.users.create({
          name: t.name,
          email: t.email,
          passwordHash: await bcrypt.hash(t.password, 10),
          role: 'tutor',
          bio: t.bio,
          hourlyRate: t.hourlyRate,
          subjects: subject ? [subject] : [],
        }),
      );
      await this.addFutureSlots(tutor);
    }

    // Quick-demo-login tutor account, same convention as the shop project's
    // seller@demo.com / customer@demo.com — but with a real name and subject
    // instead of a generic placeholder.
    const biology = await this.subjects.findOne({ where: { name: 'أحياء' } });
    const demoTutor = await this.users.save(
      this.users.create({
        name: 'Mohamed Al-Kasem',
        email: 'tutor@demo.com',
        passwordHash: await bcrypt.hash('Demo1234', 10),
        role: 'tutor',
        bio: 'مدرّس أحياء، بحب يخلّي المادة قريبة من حياة الطالب اليومية بدل الحفظ الجاف.',
        hourlyRate: 20,
        subjects: biology ? [biology] : [],
      }),
    );
    await this.addFutureSlots(demoTutor);

    await this.users.save(
      this.users.create({
        name: 'Demo Student',
        email: 'student@demo.com',
        passwordHash: await bcrypt.hash('Demo1234', 10),
        role: 'student',
      }),
    );

    // Admin account — same name used across the shop project, repurposed here.
    await this.users.save(
      this.users.create({
        name: 'Malaz Mansour',
        email: 'malaz@gmail.com',
        passwordHash: await bcrypt.hash('password1', 10),
        role: 'admin',
      }),
    );

    this.logger.log('Seed complete.');
  }

  private async addFutureSlots(tutor: User) {
    const days = [1, 2];
    const hours = [10, 15];
    for (let i = 0; i < days.length; i++) {
      const start = new Date();
      start.setDate(start.getDate() + days[i]);
      start.setHours(hours[i], 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      await this.slots.save(
        this.slots.create({ tutor, startTime: start, endTime: end }),
      );
    }
  }
}
