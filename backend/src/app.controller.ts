import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      service: 'tutoring-backend',
      status: 'ok',
      docs: 'راجع README.md لقائمة نقاط الـ API — هاد الجذر بس فحص سريع إنو الخادم شغّال.',
    };
  }
}
