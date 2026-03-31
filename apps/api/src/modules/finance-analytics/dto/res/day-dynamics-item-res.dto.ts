import { Expose } from 'class-transformer';

export class DayDynamicsItemResDto {
  @Expose()
  date!: string;

  @Expose()
  income!: number;

  @Expose()
  expense!: number;

  @Expose()
  balance!: number;
}
