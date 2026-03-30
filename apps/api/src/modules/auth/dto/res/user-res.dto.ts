import { Expose } from 'class-transformer';
import { type IUserResponse } from '@daylist/common';

export class UserResDto implements IUserResponse {
  @Expose()
  email!: string;
}
