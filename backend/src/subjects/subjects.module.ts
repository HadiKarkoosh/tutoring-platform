import { Module, OnModuleInit } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '../entities/subject.entity';
import { SubjectsController } from './subjects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subject])],
  controllers: [SubjectsController],
})
export class SubjectsModule implements OnModuleInit {
  constructor(
    @InjectRepository(Subject) private subjects: Repository<Subject>,
  ) {}

  /** Seed default subjects on first boot. */
  async onModuleInit() {
    const count = await this.subjects.count();
    if (count === 0) {
      await this.subjects.save(
        [
          'رياضيات',
          'فيزياء',
          'كيمياء',
          'أحياء',
          'لغة إنجليزية',
          'لغة عربية',
          'برمجة',
        ].map((name) => this.subjects.create({ name })),
      );
    }
  }
}
