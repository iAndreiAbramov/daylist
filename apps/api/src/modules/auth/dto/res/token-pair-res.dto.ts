import { Expose } from 'class-transformer';

export class TokenPairResDto {
  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;
}
