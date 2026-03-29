import { type IUserResponse } from '@daylist/common';
import { Expose } from 'class-transformer';

export class UserResDto implements IUserResponse {
  @Expose()
  id!: string;

  @Expose()
  email!: string;
}
