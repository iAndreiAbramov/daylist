import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { authConfig } from '../../../lib/config/auth.config';
import { RefreshToken, User } from '../../../typeorm/entities';
import { makeQueryBuilder } from '../../../test/makeQueryBuilder';
import { AuthService } from './auth.service';

const mockAuthConfig = {
  accessSecret: 'access-secret',
  refreshSecret: 'refresh-secret',
  accessExpiresIn: '15m',
  refreshExpiresIn: '30d',
};

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-id',
    email: 'test@example.com',
    passwordHash: null,
    googleId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

function makeRefreshToken(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return {
    id: 'token-id',
    userId: 'user-id',
    user: makeUser(),
    token: 'hashed-token',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    ...overrides,
  } as RefreshToken;
}

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<
    Pick<
      Repository<User>,
      'findOneBy' | 'create' | 'save' | 'createQueryBuilder'
    >
  >;
  let refreshTokenRepo: jest.Mocked<
    Pick<
      Repository<RefreshToken>,
      'create' | 'save' | 'delete' | 'createQueryBuilder'
    >
  > & { manager: { transaction: jest.Mock } };
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
            manager: { transaction: jest.fn() },
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('access-token') },
        },
        {
          provide: authConfig.KEY,
          useValue: mockAuthConfig,
        },
      ],
    }).compile();

    service = module.get(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    refreshTokenRepo = module.get(getRepositoryToken(RefreshToken));
    jwtService = module.get(JwtService);
  });

  describe('validateUser', () => {
    it('returns user when credentials are valid', async () => {
      const hash = await bcrypt.hash('password123', 10);
      const user = makeUser({ passwordHash: hash });
      userRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder(user));

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual(user);
    });

    it('returns null when user not found', async () => {
      userRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder(null));

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('returns null when password is incorrect', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      userRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder(makeUser({ passwordHash: hash })),
      );

      const result = await service.validateUser(
        'test@example.com',
        'wrong-password',
      );

      expect(result).toBeNull();
    });

    it('returns null when user has no passwordHash', async () => {
      userRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder(makeUser({ passwordHash: null })),
      );

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('creates user and returns token pair', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      const user = makeUser();
      userRepo.create.mockReturnValue(user);
      userRepo.save.mockResolvedValue(user);
      refreshTokenRepo.create.mockReturnValue(makeRefreshToken());
      refreshTokenRepo.save.mockResolvedValue(makeRefreshToken());

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
      });
    });

    it('throws ConflictException when email is already registered', async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser());

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns token pair', async () => {
      const user = makeUser();
      refreshTokenRepo.create.mockReturnValue(makeRefreshToken());
      refreshTokenRepo.save.mockResolvedValue(makeRefreshToken());

      const result = await service.login(user);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('refresh', () => {
    function setupTransaction() {
      refreshTokenRepo.manager.transaction.mockImplementation(async (cb) => {
        const innerRepo = {
          createQueryBuilder: refreshTokenRepo.createQueryBuilder,
          delete: refreshTokenRepo.delete,
        };
        return cb({ getRepository: () => innerRepo });
      });
    }

    it('returns new token pair and deletes old refresh token', async () => {
      const rawToken = 'raw-refresh-token';
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const stored = makeRefreshToken({ token: tokenHash });

      setupTransaction();
      refreshTokenRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder(stored),
      );
      refreshTokenRepo.delete.mockResolvedValue({ affected: 1, raw: [] });
      refreshTokenRepo.create.mockReturnValue(makeRefreshToken());
      refreshTokenRepo.save.mockResolvedValue(makeRefreshToken());

      const result = await service.refresh(rawToken);

      expect(refreshTokenRepo.delete).toHaveBeenCalledWith(stored.id);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws UnauthorizedException when token not found', async () => {
      setupTransaction();
      refreshTokenRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder(null),
      );

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when token is expired', async () => {
      const rawToken = 'raw-refresh-token';
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expired = makeRefreshToken({
        token: tokenHash,
        expiresAt: new Date(Date.now() - 1000),
      });

      setupTransaction();
      refreshTokenRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder(expired),
      );

      await expect(service.refresh(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('deletes refresh token by hash and userId', async () => {
      const rawToken = 'raw-refresh-token';
      const userId = 'user-uuid';
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      refreshTokenRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.logout(rawToken, userId);

      expect(refreshTokenRepo.delete).toHaveBeenCalledWith({
        token: tokenHash,
        userId,
      });
    });
  });
});
