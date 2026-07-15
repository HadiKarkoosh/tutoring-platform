import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { ReviewsService } from './reviews.service';

class CreateReviewDto {
  @IsUUID()
  tutorId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

@Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @Post()
  create(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviews.create(req.user.id, dto);
  }

  @Get('tutor/:tutorId')
  findForTutor(@Param('tutorId') tutorId: string) {
    return this.reviews.findForTutor(tutorId);
  }
}
