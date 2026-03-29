import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { type ITokenPairResponse } from '@daylist/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { authConfig } from '../../../lib/config/auth.config';
import { RefreshToken } from '../../../typeorm/entities/refresh-token.entity';
import { User } from '../../../typeorm/entities/user.entity';
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
      throw new ConflictException('Email already registered');
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

    let user: User | null = null;

    await this.refreshTokenRepo.manager.transaction(async (manager) => {
      const rtRepo = manager.getRepository(RefreshToken);

      const stored = await rtRepo
        .createQueryBuilder('rt')
        .innerJoinAndSelect('rt.user', 'user')
        .setLock('pessimistic_write')
        .where('rt.token = :token', { token: tokenHash })
        .getOne();

      if (!stored || stored.expiresAt < now) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      await rtRepo.delete(stored.id);
      user = stored.user;
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.generateTokenPair(user);
  }

  async logout(rawRefreshToken: string, userId: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.refreshTokenRepo.delete({ token: tokenHash, userId });
  }

  async generateTokenPair(user: User): Promise<ITokenPairResponse> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload);

    const rawRefreshToken = randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const expiresAt = this.parseExpiresIn(this.config.refreshExpiresIn);
    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId: user.id,
        token: tokenHash,
        expiresAt,
      }),
    );

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiresIn(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid expiresIn format: ${expiresIn}`);

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const msMap: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * msMap[unit]);
  }
}
