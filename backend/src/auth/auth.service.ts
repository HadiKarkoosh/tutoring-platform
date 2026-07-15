import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { In, Repository } from 'typeorm';
import { Subject } from '../entities/subject.entity';
import { User } from '../entities/user.entity';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto';
import { JwtPayload } from './jwt.strategy';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

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

  /**
   * Portfolio-scale project with no email provider wired up: instead of
   * sending an email, the reset link is returned directly in the response
   * so the flow is fully demoable. A real deployment would email `resetUrl`
   * and drop it from the API response.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const genericMessage =
      'إذا كان البريد الإلكتروني مسجّل عندنا، رح تلاقي رابط إعادة التعيين هون.';
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) return { message: genericMessage };

    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.users.save(user);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return {
      message: genericMessage,
      resetUrl: `${frontendUrl}/reset-password?token=${token}`,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect(['u.resetTokenHash', 'u.resetTokenExpiresAt'])
      .where('u.resetTokenHash = :tokenHash', { tokenHash })
      .getOne();
    if (
      !user ||
      !user.resetTokenExpiresAt ||
      user.resetTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('رابط إعادة التعيين غير صالح أو منتهي الصلاحية');
    }
    user.passwordHash = await bcrypt.hash(dto.password, 10);
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    await this.users.save(user);
    return { message: 'تم تغيير كلمة المرور بنجاح' };
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
