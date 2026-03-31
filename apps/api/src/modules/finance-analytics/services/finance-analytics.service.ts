import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  FindOptionsWhere,
  LessThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { FinanceEntryTypeEnum } from '@daylist/common';
import { FinanceEntry } from '@typeorm/entities';
import type { FinanceAnalyticsQueryReqDto } from '../dto/req/finance-analytics-query-req.dto';
import type { CategoryBreakdownItemResDto } from '../dto/res/category-breakdown-item-res.dto';
import type { DayDynamicsItemResDto } from '../dto/res/day-dynamics-item-res.dto';
import type { FinanceAnalyticsResDto } from '../dto/res/finance-analytics-res.dto';
import type { LargestTransactionResDto } from '../dto/res/largest-transaction-res.dto';
import type { PreviousPeriodResDto } from '../dto/res/previous-period-res.dto';
import type { TopCategoryItemResDto } from '../dto/res/top-category-item-res.dto';

const TOP_CATEGORIES_LIMIT = 5;
const LARGEST_TRANSACTIONS_LIMIT = 10;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MS_PER_DAY =
  MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;

@Injectable()
export class FinanceAnalyticsService {
  constructor(
    @InjectRepository(FinanceEntry)
    private readonly financeEntryRepo: Repository<FinanceEntry>,
  ) {}

  async getAnalytics(
    userId: string,
    query: FinanceAnalyticsQueryReqDto,
  ): Promise<FinanceAnalyticsResDto> {
    if (
      query.from &&
      query.to &&
      new Date(query.from).getTime() > new Date(query.to).getTime()
    ) {
      throw new BadRequestException('from must be less than or equal to to');
    }

    const entries = await this.loadEntries(userId, query.from, query.to);

    let previousPeriod: PreviousPeriodResDto | null = null;
    if (query.from && query.to) {
      const prev = this.getPreviousPeriodRange(query.from, query.to);
      const prevEntries = await this.loadEntries(userId, prev.from, prev.to);
      previousPeriod = this.computePreviousPeriod(prevEntries);
    }

    return {
      ...this.computeMetrics(entries, query.from, query.to),
      previousPeriod,
    };
  }

  private async loadEntries(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<FinanceEntry[]> {
    const where: FindOptionsWhere<FinanceEntry> = { userId };
    if (from && to) {
      const toDate = new Date(to);
      toDate.setUTCDate(toDate.getUTCDate() + 1);
      where.date = And(MoreThanOrEqual(new Date(from)), LessThan(toDate));
    } else if (from) {
      where.date = MoreThanOrEqual(new Date(from));
    } else if (to) {
      const toDate = new Date(to);
      toDate.setUTCDate(toDate.getUTCDate() + 1);
      where.date = LessThan(toDate);
    }
    return this.financeEntryRepo.find({ where, order: { date: 'ASC' } });
  }

  private computeMetrics(
    entries: FinanceEntry[],
    from?: string,
    to?: string,
  ): Omit<FinanceAnalyticsResDto, 'previousPeriod'> {
    const income = entries
      .filter((e) => e.type === FinanceEntryTypeEnum.Income)
      .reduce((sum, e) => sum + e.amount, 0);
    const expense = entries
      .filter((e) => e.type === FinanceEntryTypeEnum.Expense)
      .reduce((sum, e) => sum + e.amount, 0);
    const balance = income - expense;
    const savingsRate = income > 0 ? (balance / income) * 100 : 0;

    const days = this.getDayCount(entries, from, to);
    const avgPerDay = days > 0 ? balance / days : 0;

    return {
      income,
      expense,
      balance,
      savingsRate,
      avgPerDay,
      byCategory: this.computeByCategory(entries),
      byDay: this.computeByDay(entries),
      topCategories: this.computeTopCategories(entries),
      largestTransactions: this.computeLargestTransactions(entries),
    };
  }

  private groupByCategory(
    entries: FinanceEntry[],
  ): Map<string, { income: number; expense: number }> {
    const map = new Map<string, { income: number; expense: number }>();
    for (const e of entries) {
      const current = map.get(e.categoryId) ?? { income: 0, expense: 0 };
      if (e.type === FinanceEntryTypeEnum.Income) {
        current.income += e.amount;
      } else {
        current.expense += e.amount;
      }
      map.set(e.categoryId, current);
    }
    return map;
  }

  private computeByCategory(
    entries: FinanceEntry[],
  ): CategoryBreakdownItemResDto[] {
    return [...this.groupByCategory(entries).entries()].map(
      ([categoryId, data]) => ({
        categoryId,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense,
      }),
    );
  }

  private computeByDay(entries: FinanceEntry[]): DayDynamicsItemResDto[] {
    const map = new Map<string, { income: number; expense: number }>();
    for (const e of entries) {
      const day = e.date.toISOString().split('T')[0];
      const current = map.get(day) ?? { income: 0, expense: 0 };
      if (e.type === FinanceEntryTypeEnum.Income) {
        current.income += e.amount;
      } else {
        current.expense += e.amount;
      }
      map.set(day, current);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense,
      }));
  }

  private computeTopCategories(
    entries: FinanceEntry[],
  ): TopCategoryItemResDto[] {
    const categories = [...this.groupByCategory(entries).entries()];

    const topExpense: TopCategoryItemResDto[] = categories
      .filter(([, data]) => data.expense > 0)
      .sort(([, a], [, b]) => b.expense - a.expense)
      .slice(0, TOP_CATEGORIES_LIMIT)
      .map(([categoryId, data]) => ({
        categoryId,
        total: data.expense,
        type: FinanceEntryTypeEnum.Expense,
      }));

    const topIncome: TopCategoryItemResDto[] = categories
      .filter(([, data]) => data.income > 0)
      .sort(([, a], [, b]) => b.income - a.income)
      .slice(0, TOP_CATEGORIES_LIMIT)
      .map(([categoryId, data]) => ({
        categoryId,
        total: data.income,
        type: FinanceEntryTypeEnum.Income,
      }));

    return [...topExpense, ...topIncome];
  }

  private computeLargestTransactions(
    entries: FinanceEntry[],
  ): LargestTransactionResDto[] {
    return [...entries]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, LARGEST_TRANSACTIONS_LIMIT)
      .map((e) => ({
        id: e.id,
        amount: e.amount,
        type: e.type,
        categoryId: e.categoryId,
        date: e.date,
        description: e.description,
        currency: e.currency,
      }));
  }

  private computePreviousPeriod(entries: FinanceEntry[]): PreviousPeriodResDto {
    const income = entries
      .filter((e) => e.type === FinanceEntryTypeEnum.Income)
      .reduce((sum, e) => sum + e.amount, 0);
    const expense = entries
      .filter((e) => e.type === FinanceEntryTypeEnum.Expense)
      .reduce((sum, e) => sum + e.amount, 0);
    const balance = income - expense;
    return {
      income,
      expense,
      balance,
      savingsRate: income > 0 ? (balance / income) * 100 : 0,
    };
  }

  private getDayCount(
    entries: FinanceEntry[],
    from?: string,
    to?: string,
  ): number {
    if (from && to) {
      const ms = new Date(to).getTime() - new Date(from).getTime();
      return Math.ceil(ms / MS_PER_DAY) + 1;
    }
    if (entries.length === 0) return 0;
    const timestamps = entries.map((e) => e.date.getTime());
    const ms = Math.max(...timestamps) - Math.min(...timestamps);
    return Math.ceil(ms / MS_PER_DAY) + 1;
  }

  private getPreviousPeriodRange(
    from: string,
    to: string,
  ): { from: string; to: string } {
    const fromMs = new Date(from).getTime();
    const toMs = new Date(to).getTime();
    const durationMs = toMs - fromMs + MS_PER_DAY;
    const prevFrom = new Date(fromMs - durationMs);
    const prevTo = new Date(fromMs - MS_PER_DAY);
    return {
      from: prevFrom.toISOString().split('T')[0],
      to: prevTo.toISOString().split('T')[0],
    };
  }
}
