import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { FinanceEntryTypeEnum } from '@daylist/common';
import { FinanceEntry } from '@typeorm/entities';
import { FinanceService } from './finance.service';

function makeEntry(overrides: Partial<FinanceEntry> = {}): FinanceEntry {
  return {
    id: 'entry-id',
    userId: 'user-id',
    categoryId: 'cat-id',
    amount: 100,
    type: FinanceEntryTypeEnum.Expense,
    description: null,
    date: new Date('2026-01-15'),
    currency: 'RUB',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as FinanceEntry;
}

describe('FinanceService', () => {
  let service: FinanceService;
  let financeEntryRepo: jest.Mocked<
    Pick<
      Repository<FinanceEntry>,
      'find' | 'findOneBy' | 'create' | 'save' | 'delete'
    >
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        {
          provide: getRepositoryToken(FinanceEntry),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(FinanceService);
    financeEntryRepo = module.get(getRepositoryToken(FinanceEntry));
  });

  describe('findAll', () => {
    it('returns all entries for user without filters', async () => {
      const entries = [makeEntry()];
      financeEntryRepo.find.mockResolvedValue(entries);

      const result = await service.findAll('user-id', {});

      expect(financeEntryRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        order: { date: 'DESC' },
      });
      expect(result).toEqual(entries);
    });

    it('filters by categoryId and type', async () => {
      financeEntryRepo.find.mockResolvedValue([]);

      await service.findAll('user-id', {
        categoryId: 'cat-id',
        type: FinanceEntryTypeEnum.Income,
      });

      expect(financeEntryRepo.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          categoryId: 'cat-id',
          type: FinanceEntryTypeEnum.Income,
        },
        order: { date: 'DESC' },
      });
    });

    it('filters by date range with both from and to', async () => {
      financeEntryRepo.find.mockResolvedValue([]);

      await service.findAll('user-id', {
        from: '2026-01-01',
        to: '2026-01-31',
      });

      expect(financeEntryRepo.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          date: Between(new Date('2026-01-01'), new Date('2026-01-31')),
        },
        order: { date: 'DESC' },
      });
    });

    it('filters by date with only from', async () => {
      financeEntryRepo.find.mockResolvedValue([]);

      await service.findAll('user-id', { from: '2026-01-01' });

      expect(financeEntryRepo.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          date: MoreThanOrEqual(new Date('2026-01-01')),
        },
        order: { date: 'DESC' },
      });
    });

    it('filters by date with only to', async () => {
      financeEntryRepo.find.mockResolvedValue([]);

      await service.findAll('user-id', { to: '2026-01-31' });

      expect(financeEntryRepo.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          date: LessThanOrEqual(new Date('2026-01-31')),
        },
        order: { date: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('creates and returns a finance entry', async () => {
      const entry = makeEntry();
      financeEntryRepo.create.mockReturnValue(entry);
      financeEntryRepo.save.mockResolvedValue(entry);

      const result = await service.create('user-id', {
        categoryId: 'cat-id',
        amount: 100,
        type: FinanceEntryTypeEnum.Expense,
      });

      expect(financeEntryRepo.create).toHaveBeenCalledWith({
        categoryId: 'cat-id',
        amount: 100,
        type: FinanceEntryTypeEnum.Expense,
        userId: 'user-id',
      });
      expect(result).toEqual(entry);
    });
  });

  describe('update', () => {
    it('updates and returns the entry', async () => {
      const entry = makeEntry();
      financeEntryRepo.findOneBy.mockResolvedValue(entry);
      financeEntryRepo.save.mockResolvedValue({
        ...entry,
        amount: 200,
      } as FinanceEntry);

      const result = await service.update('user-id', 'entry-id', {
        amount: 200,
      });

      expect(financeEntryRepo.findOneBy).toHaveBeenCalledWith({
        id: 'entry-id',
        userId: 'user-id',
      });
      expect(result).toMatchObject({ amount: 200 });
    });

    it('throws NotFoundException when entry not found', async () => {
      financeEntryRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('user-id', 'entry-id', { amount: 200 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the entry', async () => {
      financeEntryRepo.findOneBy.mockResolvedValue(makeEntry());
      financeEntryRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove('user-id', 'entry-id');

      expect(financeEntryRepo.delete).toHaveBeenCalledWith('entry-id');
    });

    it('throws NotFoundException when entry not found', async () => {
      financeEntryRepo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('user-id', 'entry-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
