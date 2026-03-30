import { AppConsoleLogger } from '@modules/logger/app-console-logger';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import type { StringValue } from 'ms';
import * as ms from 'ms';
import { EntityManager, Repository } from 'typeorm';
import { type ITokenPairResponse } from '@daylist/common';
import { authConfig } from '@lib/config/auth.config';
import { RefreshToken } from '@typeorm/entities/refresh-token.entity';
import { User } from '@typeorm/entities/user.entity';
import type { RegisterReqDto } from '../dto/req/register-req.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
    private readonly logger: AppConsoleLogger,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.passwordHash'])
      .where('user.email = :email', { email })
      .getOne();
    if (!user || !user.passwordHash) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    return isMatch ? user : null;
  }

  async register(dto: RegisterReqDto): Promise<ITokenPairResponse> {
    const existing = await this.userRepo.findOneBy({ email: dto.email });
    if (existing) {
      this.logger.error(
        'Email already registered',
        AuthService.name,
        this.register.name,
      );
      return this.generateFakeTokenPair();
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ email: dto.email, passwordHash });
    await this.userRepo.save(user);

    return this.generateTokenPair(user);
  }

  async login(user: User): Promise<ITokenPairResponse> {
    return this.generateTokenPair(user);
  }

  async refresh(rawRefreshToken: string): Promise<ITokenPairResponse> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const now = new Date();

    return this.refreshTokenRepo.manager.transaction(async (manager) => {
      const rtRepo = manager.getRepository(RefreshToken);

      const stored = await rtRepo
        .createQueryBuilder('rt')
        .innerJoinAndSelect('rt.user', 'user')
        .setLock('pessimistic_write')
        .where('rt.token = :token', { token: tokenHash })
        .getOne();

      if (!stored || stored.expiresAt < now) {
        this.logger.error(
          'Invalid or expired refresh token',
          AuthService.name,
          this.refresh.name,
        );
        throw new UnauthorizedException();
      }

      await rtRepo.delete(stored.id);
      return this.generateTokenPair(stored.user, manager);
    });
  }

  async logout(rawRefreshToken: string, userId: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.refreshTokenRepo.delete({ token: tokenHash, userId });
  }

  async generateTokenPair(
    user: User,
    manager?: EntityManager,
  ): Promise<ITokenPairResponse> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload);

    const rawRefreshToken = randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const expiresAt = this.parseExpiresIn(this.config.refreshExpiresIn);
    const rtRepo = manager
      ? manager.getRepository(RefreshToken)
      : this.refreshTokenRepo;
    await rtRepo.save(
      rtRepo.create({
        userId: user.id,
        token: tokenHash,
        expiresAt,
      }),
    );

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private generateFakeTokenPair(): ITokenPairResponse {
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: randomBytes(16).toString('hex'),
        exp: Math.floor(Date.now() / 1000) + 900,
      }),
    ).toString('base64url');
    const signature = randomBytes(32).toString('base64url');
    return {
      accessToken: `${header}.${payload}.${signature}`,
      refreshToken: randomBytes(64).toString('hex'),
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiresIn(expiresIn: StringValue): Date {
    const milliseconds = ms(expiresIn);
    if (milliseconds === undefined) {
      throw new Error(`Invalid expiresIn format: ${expiresIn}`);
    }

    return new Date(Date.now() + milliseconds);
  }
}
