import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  users() {
    return this.admin.users_();
  }

  @Get('pricing')
  pricing() {
    return this.admin.pricing();
  }

  @Get('bookings')
  bookings() {
    return this.admin.bookings_();
  }
}
