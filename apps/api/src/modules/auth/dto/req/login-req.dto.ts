import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class LoginReqDto {
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
