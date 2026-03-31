import { AppConsoleLogger } from '@modules/logger/app-console-logger';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { And, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CategoryTypeEnum, FinanceEntryTypeEnum } from '@daylist/common';
import { Category, FinanceEntry } from '@typeorm/entities';
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

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-id',
    userId: 'user-id',
    name: 'Test category',
    type: CategoryTypeEnum.Finance,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Category;
}

describe('FinanceService', () => {
  let service: FinanceService;
  let financeEntryRepo: jest.Mocked<
    Pick<
      Repository<FinanceEntry>,
      'find' | 'findOneBy' | 'create' | 'save' | 'delete'
    >
  >;
  let categoryRepo: jest.Mocked<Pick<Repository<Category>, 'findOneBy'>>;

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
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: AppConsoleLogger,
          useValue: { info: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(FinanceService);
    financeEntryRepo = module.get(getRepositoryToken(FinanceEntry));
    categoryRepo = module.get(getRepositoryToken(Category));
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
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-01-31T23:59:59.999Z',
      });

      expect(financeEntryRepo.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          date: And(
            MoreThanOrEqual(new Date('2026-01-01T00:00:00.000Z')),
            LessThanOrEqual(new Date('2026-01-31T23:59:59.999Z')),
          ),
        },
        order: { date: 'DESC' },
      });
    });

    it('filters by date with only from', async () => {
      financeEntryRepo.find.mockResolvedValue([]);

      await service.findAll('user-id', { from: '2026-01-01T00:00:00.000Z' });

      expect(financeEntryRepo.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          date: MoreThanOrEqual(new Date('2026-01-01T00:00:00.000Z')),
        },
        order: { date: 'DESC' },
      });
    });

    it('throws BadRequestException when from is after to', async () => {
      await expect(
        service.findAll('user-id', {
          from: '2026-01-31T23:59:59.999Z',
          to: '2026-01-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('filters by date with only to', async () => {
      financeEntryRepo.find.mockResolvedValue([]);

      await service.findAll('user-id', { to: '2026-01-31T23:59:59.999Z' });

      expect(financeEntryRepo.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          date: LessThanOrEqual(new Date('2026-01-31T23:59:59.999Z')),
        },
        order: { date: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('creates and returns a finance entry', async () => {
      const entry = makeEntry();
      categoryRepo.findOneBy.mockResolvedValue(makeCategory());
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

    it('throws BadRequestException when category does not belong to user', async () => {
      categoryRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.create('user-id', {
          categoryId: 'cat-id',
          amount: 100,
          type: FinanceEntryTypeEnum.Expense,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when category has wrong type', async () => {
      categoryRepo.findOneBy.mockResolvedValue(
        makeCategory({ type: CategoryTypeEnum.Task }),
      );

      await expect(
        service.create('user-id', {
          categoryId: 'cat-id',
          amount: 100,
          type: FinanceEntryTypeEnum.Expense,
        }),
      ).rejects.toThrow(BadRequestException);
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

    it('throws BadRequestException when new categoryId does not belong to user', async () => {
      financeEntryRepo.findOneBy.mockResolvedValue(makeEntry());
      categoryRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('user-id', 'entry-id', { categoryId: 'new-cat-id' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when new categoryId has wrong type', async () => {
      financeEntryRepo.findOneBy.mockResolvedValue(makeEntry());
      categoryRepo.findOneBy.mockResolvedValue(
        makeCategory({ type: CategoryTypeEnum.Task }),
      );

      await expect(
        service.update('user-id', 'entry-id', { categoryId: 'new-cat-id' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deletes the entry atomically by id and userId', async () => {
      financeEntryRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove('user-id', 'entry-id');

      expect(financeEntryRepo.delete).toHaveBeenCalledWith({
        id: 'entry-id',
        userId: 'user-id',
      });
    });

    it('throws NotFoundException when entry not found', async () => {
      financeEntryRepo.delete.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.remove('user-id', 'entry-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
