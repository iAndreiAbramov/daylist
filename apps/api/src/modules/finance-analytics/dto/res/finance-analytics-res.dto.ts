import { Expose, Type } from 'class-transformer';
import { CategoryBreakdownItemResDto } from './category-breakdown-item-res.dto';
import { DayDynamicsItemResDto } from './day-dynamics-item-res.dto';
import { LargestTransactionResDto } from './largest-transaction-res.dto';
import { PreviousPeriodResDto } from './previous-period-res.dto';
import { TopCategoryItemResDto } from './top-category-item-res.dto';

export class FinanceAnalyticsResDto {
  @Expose()
  income!: number;

  @Expose()
  expense!: number;

  @Expose()
  balance!: number;

  @Expose()
  savingsRate!: number;

  @Expose()
  avgPerDay!: number;

  @Expose()
  @Type(() => CategoryBreakdownItemResDto)
  byCategory!: CategoryBreakdownItemResDto[];

  @Expose()
  @Type(() => DayDynamicsItemResDto)
  byDay!: DayDynamicsItemResDto[];

  @Expose()
  @Type(() => TopCategoryItemResDto)
  topCategories!: TopCategoryItemResDto[];

  @Expose()
  @Type(() => LargestTransactionResDto)
  largestTransactions!: LargestTransactionResDto[];

  @Expose()
  @Type(() => PreviousPeriodResDto)
  previousPeriod!: PreviousPeriodResDto | null;
}
