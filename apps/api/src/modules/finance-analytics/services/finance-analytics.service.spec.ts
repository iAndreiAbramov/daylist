import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceEntryTypeEnum } from '@daylist/common';
import { FinanceEntry } from '@typeorm/entities';
import { FinanceAnalyticsService } from './finance-analytics.service';

function makeEntry(overrides: Partial<FinanceEntry> = {}): FinanceEntry {
  return {
    id: 'entry-id',
    userId: 'user-id',
    categoryId: 'cat-id',
    amount: 100,
    type: FinanceEntryTypeEnum.Expense,
    description: null,
    date: new Date('2024-01-15T00:00:00.000Z'),
    currency: 'RUB',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as FinanceEntry;
}

describe('FinanceAnalyticsService', () => {
  let service: FinanceAnalyticsService;
  let financeEntryRepo: jest.Mocked<Pick<Repository<FinanceEntry>, 'find'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceAnalyticsService,
        {
          provide: getRepositoryToken(FinanceEntry),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(FinanceAnalyticsService);
    financeEntryRepo = module.get(getRepositoryToken(FinanceEntry));
  });

  describe('getAnalytics', () => {
    it('returns zeroed metrics when no entries', async () => {
      financeEntryRepo.find.mockResolvedValue([]);

      const result = await service.getAnalytics('user-id', {});

      expect(result.income).toBe(0);
      expect(result.expense).toBe(0);
      expect(result.balance).toBe(0);
      expect(result.savingsRate).toBe(0);
      expect(result.byCategory).toEqual([]);
      expect(result.byDay).toEqual([]);
      expect(result.topCategories).toEqual([]);
      expect(result.largestTransactions).toEqual([]);
      expect(result.previousPeriod).toBeNull();
    });

    it('computes income, expense and balance correctly', async () => {
      financeEntryRepo.find.mockResolvedValue([
        makeEntry({ id: '1', type: FinanceEntryTypeEnum.Income, amount: 1000 }),
        makeEntry({ id: '2', type: FinanceEntryTypeEnum.Expense, amount: 300 }),
        makeEntry({ id: '3', type: FinanceEntryTypeEnum.Expense, amount: 200 }),
      ]);

      const result = await service.getAnalytics('user-id', {});

      expect(result.income).toBe(1000);
      expect(result.expense).toBe(500);
      expect(result.balance).toBe(500);
    });

    it('computes savingsRate correctly', async () => {
      financeEntryRepo.find.mockResolvedValue([
        makeEntry({ id: '1', type: FinanceEntryTypeEnum.Income, amount: 1000 }),
        makeEntry({ id: '2', type: FinanceEntryTypeEnum.Expense, amount: 250 }),
      ]);

      const result = await service.getAnalytics('user-id', {});

      expect(result.savingsRate).toBe(75);
    });

    it('returns savingsRate 0 when income is 0', async () => {
      financeEntryRepo.find.mockResolvedValue([
        makeEntry({ id: '1', type: FinanceEntryTypeEnum.Expense, amount: 500 }),
      ]);

      const result = await service.getAnalytics('user-id', {});

      expect(result.savingsRate).toBe(0);
    });

    it('computes byCategory breakdown correctly', async () => {
      financeEntryRepo.find.mockResolvedValue([
        makeEntry({
          id: '1',
          categoryId: 'cat-1',
          type: FinanceEntryTypeEnum.Income,
          amount: 500,
        }),
        makeEntry({
          id: '2',
          categoryId: 'cat-1',
          type: FinanceEntryTypeEnum.Expense,
          amount: 200,
        }),
        makeEntry({
          id: '3',
          categoryId: 'cat-2',
          type: FinanceEntryTypeEnum.Expense,
          amount: 100,
        }),
      ]);

      const result = await service.getAnalytics('user-id', {});

      const cat1 = result.byCategory.find((c) => c.categoryId === 'cat-1');
      expect(cat1).toMatchObject({ income: 500, expense: 200, balance: 300 });

      const cat2 = result.byCategory.find((c) => c.categoryId === 'cat-2');
      expect(cat2).toMatchObject({ income: 0, expense: 100, balance: -100 });
    });

    it('computes byDay breakdown sorted by date', async () => {
      financeEntryRepo.find.mockResolvedValue([
        makeEntry({
          id: '1',
          type: FinanceEntryTypeEnum.Income,
          amount: 500,
          date: new Date('2024-01-10T00:00:00.000Z'),
        }),
        makeEntry({
          id: '2',
          type: FinanceEntryTypeEnum.Expense,
          amount: 200,
          date: new Date('2024-01-10T00:00:00.000Z'),
        }),
        makeEntry({
          id: '3',
          type: FinanceEntryTypeEnum.Expense,
          amount: 100,
          date: new Date('2024-01-15T00:00:00.000Z'),
        }),
      ]);

      const result = await service.getAnalytics('user-id', {});

      expect(result.byDay).toHaveLength(2);
      expect(result.byDay[0]).toMatchObject({
        date: '2024-01-10',
        income: 500,
        expense: 200,
        balance: 300,
      });
      expect(result.byDay[1]).toMatchObject({
        date: '2024-01-15',
        income: 0,
        expense: 100,
        balance: -100,
      });
    });

    it('returns top categories by expense and income', async () => {
      financeEntryRepo.find.mockResolvedValue([
        makeEntry({
          id: '1',
          categoryId: 'cat-1',
          type: FinanceEntryTypeEnum.Expense,
          amount: 500,
        }),
        makeEntry({
          id: '2',
          categoryId: 'cat-2',
          type: FinanceEntryTypeEnum.Expense,
          amount: 300,
        }),
        makeEntry({
          id: '3',
          categoryId: 'cat-3',
          type: FinanceEntryTypeEnum.Income,
          amount: 1000,
        }),
      ]);

      const result = await service.getAnalytics('user-id', {});

      const expenseTop = result.topCategories.filter(
        (c) => c.type === FinanceEntryTypeEnum.Expense,
      );
      expect(expenseTop[0].categoryId).toBe('cat-1');
      expect(expenseTop[0].total).toBe(500);

      const incomeTop = result.topCategories.filter(
        (c) => c.type === FinanceEntryTypeEnum.Income,
      );
      expect(incomeTop[0].categoryId).toBe('cat-3');
    });

    it('returns largest transactions sorted by amount desc', async () => {
      financeEntryRepo.find.mockResolvedValue([
        makeEntry({ id: 'small', amount: 10 }),
        makeEntry({ id: 'large', amount: 9999 }),
        makeEntry({ id: 'mid', amount: 500 }),
      ]);

      const result = await service.getAnalytics('user-id', {});

      expect(result.largestTransactions[0].id).toBe('large');
      expect(result.largestTransactions[1].id).toBe('mid');
      expect(result.largestTransactions[2].id).toBe('small');
    });

    it('computes previousPeriod when from/to provided', async () => {
      financeEntryRepo.find
        .mockResolvedValueOnce([
          makeEntry({
            id: '1',
            type: FinanceEntryTypeEnum.Income,
            amount: 1000,
          }),
        ])
        .mockResolvedValueOnce([
          makeEntry({
            id: '2',
            type: FinanceEntryTypeEnum.Income,
            amount: 800,
          }),
          makeEntry({
            id: '3',
            type: FinanceEntryTypeEnum.Expense,
            amount: 200,
          }),
        ]);

      const result = await service.getAnalytics('user-id', {
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(result.previousPeriod).not.toBeNull();
      expect(result.previousPeriod?.income).toBe(800);
      expect(result.previousPeriod?.expense).toBe(200);
      expect(result.previousPeriod?.balance).toBe(600);
      expect(result.previousPeriod?.savingsRate).toBe(75);
    });

    it('previousPeriod is null when no date range provided', async () => {
      financeEntryRepo.find.mockResolvedValue([]);

      const result = await service.getAnalytics('user-id', {});

      expect(result.previousPeriod).toBeNull();
    });

    it('computes avgPerDay using from/to range', async () => {
      financeEntryRepo.find.mockResolvedValue([
        makeEntry({ id: '1', type: FinanceEntryTypeEnum.Income, amount: 310 }),
      ]);

      const result = await service.getAnalytics('user-id', {
        from: '2024-01-01',
        to: '2024-01-31',
      });

      // balance = 310, days = 31
      expect(result.avgPerDay).toBeCloseTo(10, 0);
    });
  });
});
