import { Expose } from 'class-transformer';

export class UserResDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;
}
