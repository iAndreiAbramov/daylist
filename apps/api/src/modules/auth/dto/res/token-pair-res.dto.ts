import { Expose } from 'class-transformer';
import { type ITokenPairResponse } from '@daylist/common';

export class TokenPairResDto implements ITokenPairResponse {
  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;
}
