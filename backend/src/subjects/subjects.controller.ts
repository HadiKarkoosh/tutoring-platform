import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '../entities/subject.entity';

@Controller('subjects')
export class SubjectsController {
  constructor(
    @InjectRepository(Subject) private subjects: Repository<Subject>,
  ) {}

  @Get()
  findAll() {
    return this.subjects.find({ order: { name: 'ASC' } });
  }
}
