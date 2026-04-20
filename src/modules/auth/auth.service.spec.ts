import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { BcryptService } from '../../core/services/bcrypt.service';
import { AuditLogService } from '../../core/services/audit-log.service';
import { ISendMailOptions } from '../../core/mail/mail.service';
import { MailQueueService } from '../../core/mail/mail-queue.service';
import { DictionaryService } from '../../core/services/dictionary.service';
import { User } from '../../core/entities/user.entity';
import { Session } from '../../core/entities/session.entity';
import { SignupDTO, UpdateMeDTO } from './auth.dto';

// --- Factories ---

function makeUser(partial: Partial<User> = {}): User {
  return Object.assign(new User(), {
    id: 'user-id-1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed:Test@1234',
    emailVerified: true,
    emailVerificationToken: null,
    language: 'ptbr',
    ...partial,
  });
}

function mockMailService(overrides: Record<string, any> = {}): MailQueueService {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    send: async (_options: ISendMailOptions) => {},
    ...overrides,
  } as unknown as MailQueueService;
}

function mockDictionary(): DictionaryService {
  return { translate: (key: string) => key } as unknown as DictionaryService;
}

function mockRepo(overrides: Record<string, any> = {}) {
  return {
    findOneOrFail: async () => { throw new Error('findOneOrFail not configured'); },
    findOne: async () => null,
    save: async (entity: any) => entity,
    delete: async () => ({ affected: 1 }),
    exists: async () => false,
    ...overrides,
  };
}

function mockDataSource(userOverrides: Record<string, any> = {}, sessionOverrides: Record<string, any> = {}) {
  const userRepo = mockRepo(userOverrides);
  const sessionRepo = mockRepo(sessionOverrides);

  return {
    getRepository: (entity: any) => {
      if (entity === User) return userRepo;
      if (entity === Session) return sessionRepo;
      return mockRepo();
    },
  } as unknown as DataSource;
}

function mockBcrypt(overrides: Partial<BcryptService> = {}): BcryptService {
  return {
    hash: async (value: string) => `hashed:${value}`,
    compare: async (value: string, hash: string) => hash === `hashed:${value}`,
    ...overrides,
  } as BcryptService;
}

function mockAuditLog(): AuditLogService {
  return { log: () => {} } as unknown as AuditLogService;
}

function mockResponse(spy: { name?: string; value?: string } = {}): Response {
  return {
    cookie: (name: string, value: string) => {
      spy.name = name;
      spy.value = value;
    },
  } as unknown as Response;
}

// --- Tests ---

describe('AuthService', () => {

  describe('getMe', () => {
    it('should return MeResponseDTO fields when user is found', async () => {
      const user = makeUser();
      const service = new AuthService(
        mockDataSource({ findOneOrFail: async () => user }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      const result = await service.getMe(user.id);

      assert.equal(result.id, user.id);
      assert.equal(result.name, user.name);
      assert.equal(result.email, user.email);
      assert.equal('password' in result, false);
    });

    it('should propagate the repository error when user is not found', async () => {
      const service = new AuthService(
        mockDataSource({ findOneOrFail: async () => { throw new Error('EntityNotFound'); } }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      await assert.rejects(() => service.getMe('nonexistent'));
    });
  });

  describe('updateMe', () => {
    it('should update name and return success message', async () => {
      const user = makeUser();
      const capture: { saved: User | null } = { saved: null };

      const service = new AuthService(
        mockDataSource({
          findOneOrFail: async () => user,
          save: async (u: User) => { capture.saved = u; return u; },
        }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      const result = await service.updateMe(user.id, { name: 'New Name' } as UpdateMeDTO);

      assert.ok(capture.saved);
      assert.equal(capture.saved.name, 'New Name');
      assert.deepEqual(result, { message: { key: 'auth.profile_updated' } });
    });

    it('should keep original name when name is undefined in body', async () => {
      const user = makeUser({ name: 'Original Name' });
      const capture: { saved: User | null } = { saved: null };

      const service = new AuthService(
        mockDataSource({
          findOneOrFail: async () => user,
          save: async (u: User) => { capture.saved = u; return u; },
        }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      await service.updateMe(user.id, {} as UpdateMeDTO);

      assert.ok(capture.saved);
      assert.equal(capture.saved.name, 'Original Name');
    });

    it('should update password when currentPassword and newPassword are provided', async () => {
      const user = makeUser();
      const capture: { saved: User | null } = { saved: null };

      const service = new AuthService(
        mockDataSource({
          findOneOrFail: async () => user,
          save: async (u: User) => { capture.saved = u; return u; },
        }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      await service.updateMe(user.id, {
        currentPassword: 'Test@1234',
        newPassword: 'New@5678',
        newPasswordConfirmation: 'New@5678',
      } as UpdateMeDTO);

      assert.ok(capture.saved);
      assert.equal(capture.saved.password, 'hashed:New@5678');
    });

    it('should throw BadRequestException when current password is wrong', async () => {
      const user = makeUser();

      const service = new AuthService(
        mockDataSource({ findOneOrFail: async () => user }),
        mockBcrypt({ compare: async () => false }),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      await assert.rejects(
        () => service.updateMe(user.id, {
          currentPassword: 'Wrong@1234',
          newPassword: 'New@5678',
          newPasswordConfirmation: 'New@5678',
        } as UpdateMeDTO),
        (err: any) => {
          assert.ok(err instanceof BadRequestException);
          assert.deepEqual(err.getResponse(), { key: 'auth.wrong_current_password' });
          return true;
        },
      );
    });

    it('should throw BadRequestException when new passwords do not match', async () => {
      const user = makeUser();

      const service = new AuthService(
        mockDataSource({ findOneOrFail: async () => user }),
        mockBcrypt({ compare: async () => true }),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      await assert.rejects(
        () => service.updateMe(user.id, {
          currentPassword: 'Test@1234',
          newPassword: 'New@5678',
          newPasswordConfirmation: 'Different@9012',
        } as UpdateMeDTO),
        (err: any) => {
          assert.ok(err instanceof BadRequestException);
          assert.deepEqual(err.getResponse(), { key: 'auth.passwords_do_not_match' });
          return true;
        },
      );
    });
  });

  describe('signup', () => {
    it('should create user with hashed password and return success message', async () => {
      const capture: { created: User | null } = { created: null };

      const service = new AuthService(
        mockDataSource({
          exists: async () => false,
          save: async (u: User) => { capture.created = u; return u; },
        }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      const body: SignupDTO = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Test@1234',
        passwordConfirmation: 'Test@1234',
      };

      const result = await service.signup(body, {}, 'en');

      assert.deepEqual(result, { message: { key: 'auth.signup_successful' } });
      assert.ok(capture.created);
      assert.equal(capture.created.name, 'John Doe');
      assert.equal(capture.created.email, 'john@example.com');
      assert.equal(capture.created.password, 'hashed:Test@1234');
      assert.equal(capture.created.language, 'en');
    });

    it('should throw BadRequestException when email is already in use', async () => {
      const service = new AuthService(
        mockDataSource({ exists: async () => true }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      await assert.rejects(
        () => service.signup({ name: 'X', email: 'taken@example.com', password: 'Test@1234', passwordConfirmation: 'Test@1234' }),
        (err: any) => {
          assert.ok(err instanceof BadRequestException);
          assert.deepEqual(err.getResponse(), { key: 'auth.email_already_in_use' });
          return true;
        },
      );
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      const service = new AuthService(
        mockDataSource({ exists: async () => false }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      await assert.rejects(
        () => service.signup({ name: 'X', email: 'john@example.com', password: 'Test@1234', passwordConfirmation: 'Test@5678' }),
        (err: any) => {
          assert.ok(err instanceof BadRequestException);
          assert.deepEqual(err.getResponse(), { key: 'auth.passwords_do_not_match' });
          return true;
        },
      );
    });
  });

  describe('signin', () => {
    it('should return session with token and set sid cookie when credentials are valid', async () => {
      const user = makeUser();
      const cookieSpy: { name?: string; value?: string } = {};

      const service = new AuthService(
        mockDataSource(
          { findOne: async () => user },
          { save: async (s: Session) => { s.id = 'session-id-1'; return s; } },
        ),
        mockBcrypt({ compare: async () => true }),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      const session = await service.signin({ email: user.email, password: 'Test@1234' }, mockResponse(cookieSpy));

      assert.equal(cookieSpy.name, 'sid');
      assert.equal(typeof session.token, 'string');
      assert.equal(session.token.length, 96);
      assert.ok(session.expiresAt instanceof Date);
      assert.equal('user' in session, false);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const service = new AuthService(
        mockDataSource({ findOne: async () => null }),
        mockBcrypt({ compare: async () => false }),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      await assert.rejects(
        () => service.signin({ email: 'ghost@example.com', password: 'Test@1234' }, mockResponse()),
        (err: any) => { assert.ok(err instanceof UnauthorizedException); return true; },
      );
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const user = makeUser();

      const service = new AuthService(
        mockDataSource({ findOne: async () => user }),
        mockBcrypt({ compare: async () => false }),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      await assert.rejects(
        () => service.signin({ email: user.email, password: 'Wrong@1234' }, mockResponse()),
        (err: any) => { assert.ok(err instanceof UnauthorizedException); return true; },
      );
    });

    it('should throw UnauthorizedException and resend email when verification token is expired', async () => {
      const user = makeUser({ emailVerified: false, emailVerificationTokenExpiresAt: new Date(Date.now() - 1000) });

      const service = new AuthService(
        mockDataSource({ findOne: async () => user }),
        mockBcrypt({ compare: async () => true }),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      await assert.rejects(
        () => service.signin({ email: user.email, password: 'Test@1234' }, mockResponse()),
        (err: any) => {
          assert.ok(err instanceof UnauthorizedException);
          assert.deepEqual(err.getResponse(), { key: 'auth.email_not_verified_new_link_sent' });
          return true;
        },
      );
    });

    it('should throw UnauthorizedException without resend when verification token is still valid', async () => {
      const user = makeUser({ emailVerified: false, emailVerificationTokenExpiresAt: new Date(Date.now() + 60_000) });

      const service = new AuthService(
        mockDataSource({ findOne: async () => user }),
        mockBcrypt({ compare: async () => true }),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      await assert.rejects(
        () => service.signin({ email: user.email, password: 'Test@1234' }, mockResponse()),
        (err: any) => {
          assert.ok(err instanceof UnauthorizedException);
          assert.deepEqual(err.getResponse(), { key: 'auth.email_not_verified' });
          return true;
        },
      );
    });
  });

  describe('verifyEmail', () => {
    it('should mark email as verified and clear token', async () => {
      const token = 'a'.repeat(100);
      const user = makeUser({ emailVerified: false, emailVerificationToken: token });
      const capture: { saved: User | null } = { saved: null };

      const service = new AuthService(
        mockDataSource({
          findOne: async () => user,
          save: async (u: User) => { capture.saved = u; return u; },
        }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      const result = await service.verifyEmail(token);

      assert.deepEqual(result, { message: { key: 'auth.email_verification_successful' } });
      assert.ok(capture.saved);
      assert.equal(capture.saved.emailVerified, true);
      assert.equal(capture.saved.emailVerificationToken, null);
    });

    it('should throw BadRequestException when token is invalid', async () => {
      const service = new AuthService(
        mockDataSource({ findOne: async () => null }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      await assert.rejects(
        () => service.verifyEmail('invalid-token'),
        (err: any) => {
          assert.ok(err instanceof BadRequestException);
          assert.deepEqual(err.getResponse(), { key: 'auth.email_verification_invalid' });
          return true;
        },
      );
    });
  });

  describe('signout', () => {
    it('should delete the specific session and return success message', async () => {
      let deletedFilter: any = null;

      const service = new AuthService(
        mockDataSource({}, { delete: async (f: any) => { deletedFilter = f; return { affected: 1 }; } }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      const result = await service.signout('user-id-1', 'session-id-1');

      assert.deepEqual(deletedFilter, { id: 'session-id-1', user: { id: 'user-id-1' } });
      assert.deepEqual(result, { message: { key: 'auth.signout_successful' } });
    });
  });

  describe('signoutAll', () => {
    it('should delete all sessions for the user and return success message', async () => {
      let deletedFilter: any = null;

      const service = new AuthService(
        mockDataSource({}, { delete: async (f: any) => { deletedFilter = f; return { affected: 3 }; } }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      const result = await service.signoutAll('user-id-1');

      assert.deepEqual(deletedFilter, { user: { id: 'user-id-1' } });
      assert.deepEqual(result, { message: { key: 'auth.signout_successful' } });
    });
  });

  describe('cancelAccount', () => {
    it('should save cancellation token and send email', async () => {
      const user = makeUser();
      const capture: { saved: User | null; mailOptions: any } = { saved: null, mailOptions: null };

      const service = new AuthService(
        mockDataSource({
          findOneOrFail: async () => user,
          save: async (u: User) => { capture.saved = u; return u; },
        }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService({ send: async (opts: any) => { capture.mailOptions = opts; } }),
        mockDictionary(),
      );

      const result = await service.cancelAccount('user-id-1', {}, 'en');

      assert.deepEqual(result, { message: { key: 'auth.cancel_account_email_sent' } });
      assert.ok(capture.saved);
      assert.ok(typeof capture.saved.cancellationToken === 'string' && capture.saved.cancellationToken.length > 0);
      assert.ok(capture.mailOptions);
      assert.equal(capture.mailOptions.template, 'account-cancellation');
      assert.equal(capture.mailOptions.userId, user.id);
    });
  });

  describe('confirmCancelAccount', () => {
    it('should delete the user when token is valid', async () => {
      const token = 'b'.repeat(100);
      const user = makeUser({ cancellationToken: token });
      let deletedFilter: any = null;

      const service = new AuthService(
        mockDataSource({
          findOne: async () => user,
          delete: async (f: any) => { deletedFilter = f; return { affected: 1 }; },
        }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      const result = await service.confirmCancelAccount(token);

      assert.deepEqual(result, { message: { key: 'auth.account_cancellation_successful' } });
      assert.deepEqual(deletedFilter, { id: user.id });
    });

    it('should throw BadRequestException when token is invalid', async () => {
      const service = new AuthService(
        mockDataSource({ findOne: async () => null }),
        mockBcrypt(),
        mockAuditLog(),
        mockMailService(),
        mockDictionary(),
      );

      await assert.rejects(
        () => service.confirmCancelAccount('invalid-token'),
        (err: any) => {
          assert.ok(err instanceof BadRequestException);
          assert.deepEqual(err.getResponse(), { key: 'auth.cancel_account_confirmation_invalid' });
          return true;
        },
      );
    });
  });

});
