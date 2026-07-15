import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Review } from '../entities/review.entity';
import { User } from '../entities/user.entity';

export interface CreateReviewInput {
  tutorId: string;
  rating: number;
  comment?: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviews: Repository<Review>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Booking) private bookings: Repository<Booking>,
  ) {}

  async create(studentId: string, dto: CreateReviewInput) {
    const tutor = await this.users.findOne({
      where: { id: dto.tutorId, role: 'tutor' },
    });
    if (!tutor) throw new NotFoundException('المدرّس غير موجود');

    const bookingCount = await this.bookings
      .createQueryBuilder('b')
      .innerJoin('b.slot', 'slot')
      .where('slot.tutorId = :tutorId', { tutorId: dto.tutorId })
      .andWhere('b.studentId = :studentId', { studentId })
      .getCount();
    if (bookingCount === 0) {
      throw new ForbiddenException(
        'لازم يكون عندك حجز مع هالمدرّس قبل ما تقدر تقيّمه',
      );
    }

    let review = await this.reviews.findOne({
      where: { tutor: { id: dto.tutorId }, student: { id: studentId } },
    });
    if (review) {
      review.rating = dto.rating;
      review.comment = dto.comment ?? null;
    } else {
      review = this.reviews.create({
        tutor: { id: dto.tutorId } as User,
        student: { id: studentId } as User,
        rating: dto.rating,
        comment: dto.comment ?? null,
      });
    }
    return this.reviews.save(review);
  }

  async findForTutor(tutorId: string) {
    const reviews = await this.reviews.find({
      where: { tutor: { id: tutorId } },
      order: { createdAt: 'DESC' },
    });
    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;
    return {
      avgRating,
      count: reviews.length,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        student: { id: r.student.id, name: r.student.name },
      })),
    };
  }
}
