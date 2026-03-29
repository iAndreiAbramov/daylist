import { type ITokenPairResponse } from '@daylist/common';
import { Expose } from 'class-transformer';

export class TokenPairResDto implements ITokenPairResponse {
  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;
}
