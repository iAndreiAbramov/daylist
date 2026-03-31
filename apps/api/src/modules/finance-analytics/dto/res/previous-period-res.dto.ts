import { Expose } from 'class-transformer';

export class PreviousPeriodResDto {
  @Expose()
  income!: number;

  @Expose()
  expense!: number;

  @Expose()
  balance!: number;

  @Expose()
  savingsRate!: number;
}
