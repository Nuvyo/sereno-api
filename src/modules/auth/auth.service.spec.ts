import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { BcryptService } from '../../core/services/bcrypt.service';
import { AuditLogService } from '../../core/services/audit-log.service';
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
    ...partial,
  });
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
      );

      await service.updateMe(user.id, {} as UpdateMeDTO);

      assert.ok(capture.saved);
      assert.equal(capture.saved.name, 'Original Name');
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
      );

      const body: SignupDTO = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Test@1234',
        passwordConfirmation: 'Test@1234',
      };

      const result = await service.signup(body);

      assert.deepEqual(result, { message: { key: 'auth.signup_successful' } });
      assert.ok(capture.created);
      assert.equal(capture.created.name, 'John Doe');
      assert.equal(capture.created.email, 'john@example.com');
      assert.equal(capture.created.password, 'hashed:Test@1234');
    });

    it('should throw BadRequestException when email is already in use', async () => {
      const service = new AuthService(
        mockDataSource({ exists: async () => true }),
        mockBcrypt(),
        mockAuditLog(),
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
      );

      await assert.rejects(
        () => service.signin({ email: user.email, password: 'Wrong@1234' }, mockResponse()),
        (err: any) => { assert.ok(err instanceof UnauthorizedException); return true; },
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
      );

      const result = await service.signoutAll('user-id-1');

      assert.deepEqual(deletedFilter, { user: { id: 'user-id-1' } });
      assert.deepEqual(result, { message: { key: 'auth.signout_successful' } });
    });
  });

  describe('cancelAccount', () => {
    it('should delete the user and return success message', async () => {
      let deletedFilter: any = null;

      const service = new AuthService(
        mockDataSource({ delete: async (f: any) => { deletedFilter = f; return { affected: 1 }; } }),
        mockBcrypt(),
        mockAuditLog(),
      );

      const result = await service.cancelAccount('user-id-1');

      assert.deepEqual(deletedFilter, { id: 'user-id-1' });
      assert.deepEqual(result, { message: { key: 'auth.account_cancellation_successful' } });
    });
  });

});
