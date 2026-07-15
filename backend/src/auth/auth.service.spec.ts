import { Test, TestingModule } from '@nestjs/testing';
import { testTypeOrmModule } from '../test-utils/test-db';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let moduleRef: TestingModule;
  let service: AuthService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [testTypeOrmModule(), AuthModule],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  afterAll(() => moduleRef.close());

  it('registers a user and returns a token + profile', async () => {
    const res = await service.register({
      name: 'أحمد',
      email: 'ahmad@test.com',
      password: '123456',
      role: 'student',
    });
    expect(res.accessToken).toBeTruthy();
    expect(res.user.email).toBe('ahmad@test.com');
    expect(res.user.role).toBe('student');
  });

  it('rejects registering the same email twice', async () => {
    await service.register({
      name: 'سارة',
      email: 'sara@test.com',
      password: '123456',
      role: 'student',
    });
    await expect(
      service.register({
        name: 'سارة 2',
        email: 'sara@test.com',
        password: '123456',
        role: 'student',
      }),
    ).rejects.toThrow();
  });

  it('logs in with the correct password', async () => {
    await service.register({
      name: 'خالد',
      email: 'khaled@test.com',
      password: 'correct-password',
      role: 'tutor',
    });
    const res = await service.login({
      email: 'khaled@test.com',
      password: 'correct-password',
    });
    expect(res.accessToken).toBeTruthy();
    expect(res.user.role).toBe('tutor');
  });

  it('rejects login with the wrong password', async () => {
    await service.register({
      name: 'ريم',
      email: 'reem@test.com',
      password: 'correct-password',
      role: 'student',
    });
    await expect(
      service.login({ email: 'reem@test.com', password: 'wrong-password' }),
    ).rejects.toThrow();
  });

  it('rejects login for a non-existent email', async () => {
    await expect(
      service.login({ email: 'nobody@test.com', password: 'whatever' }),
    ).rejects.toThrow();
  });

  it('issues a usable reset link on forgot-password and lets the password be reset', async () => {
    await service.register({
      name: 'ليلى',
      email: 'layla@test.com',
      password: 'old-password',
      role: 'student',
    });
    const forgot = await service.forgotPassword({ email: 'layla@test.com' });
    expect(forgot.resetUrl).toBeTruthy();
    const token = new URL(forgot.resetUrl!).searchParams.get('token')!;

    await service.resetPassword({ token, password: 'new-password' });

    await expect(
      service.login({ email: 'layla@test.com', password: 'old-password' }),
    ).rejects.toThrow();
    const res = await service.login({
      email: 'layla@test.com',
      password: 'new-password',
    });
    expect(res.accessToken).toBeTruthy();
  });

  it('does not reveal whether an email exists on forgot-password', async () => {
    const known = await service.forgotPassword({ email: 'khaled@test.com' });
    const unknown = await service.forgotPassword({ email: 'ghost@test.com' });
    expect(known.message).toBe(unknown.message);
    expect(unknown.resetUrl).toBeUndefined();
  });

  it('rejects an expired or unknown reset token', async () => {
    await expect(
      service.resetPassword({ token: 'not-a-real-token', password: 'whatever1' }),
    ).rejects.toThrow();
  });
});
