import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilitySlot } from '../entities/availability-slot.entity';
import { Subject } from '../entities/subject.entity';
import { User } from '../entities/user.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Subject, AvailabilitySlot])],
  providers: [SeedService],
})
export class SeedModule {}
