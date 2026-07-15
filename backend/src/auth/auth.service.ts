import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { In, Repository } from 'typeorm';
import { Subject } from '../entities/subject.entity';
import { User } from '../entities/user.entity';
import { LoginDto, RegisterDto } from './dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Subject) private subjects: Repository<Subject>,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.users.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('البريد الإلكتروني مسجّل مسبقاً');

    const user = this.users.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: dto.role,
      bio: dto.bio ?? null,
      hourlyRate: dto.role === 'tutor' ? dto.hourlyRate ?? null : null,
      subjects:
        dto.role === 'tutor' && dto.subjectIds?.length
          ? await this.subjects.findBy({ id: In(dto.subjectIds) })
          : [],
    });
    const saved = await this.users.save(user);
    return this.issueToken(saved);
  }

  async login(dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .leftJoinAndSelect('u.subjects', 's')
      .where('u.email = :email', { email: dto.email })
      .getOne();
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }
    return this.issueToken(user);
  }

  private issueToken(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        hourlyRate: user.hourlyRate,
        subjects: user.subjects ?? [],
      },
    };
  }
}
