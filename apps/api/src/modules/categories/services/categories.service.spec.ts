import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryTypeEnum } from '@daylist/common';
import { Category } from '@typeorm/entities';
import { CategoriesService } from './categories.service';

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-id',
    userId: 'user-id',
    name: 'Test',
    type: CategoryTypeEnum.Task,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Category;
}

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepo: jest.Mocked<
    Pick<
      Repository<Category>,
      'find' | 'findOneBy' | 'create' | 'save' | 'delete'
    >
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
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

    service = module.get(CategoriesService);
    categoryRepo = module.get(getRepositoryToken(Category));
  });

  describe('findAll', () => {
    it('returns all categories for user', async () => {
      const categories = [makeCategory()];
      categoryRepo.find.mockResolvedValue(categories);

      const result = await service.findAll('user-id');

      expect(categoryRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        order: { position: 'ASC' },
      });
      expect(result).toEqual(categories);
    });

    it('filters by type when provided', async () => {
      const categories = [makeCategory()];
      categoryRepo.find.mockResolvedValue(categories);

      await service.findAll('user-id', CategoryTypeEnum.Task);

      expect(categoryRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-id', type: CategoryTypeEnum.Task },
        order: { position: 'ASC' },
      });
    });
  });

  describe('create', () => {
    it('creates and returns a category', async () => {
      const category = makeCategory();
      categoryRepo.create.mockReturnValue(category);
      categoryRepo.save.mockResolvedValue(category);

      const result = await service.create('user-id', {
        name: 'Test',
        type: CategoryTypeEnum.Task,
      });

      expect(categoryRepo.create).toHaveBeenCalledWith({
        name: 'Test',
        type: CategoryTypeEnum.Task,
        userId: 'user-id',
      });
      expect(result).toEqual(category);
    });
  });

  describe('update', () => {
    it('updates and returns the category', async () => {
      const category = makeCategory();
      categoryRepo.findOneBy.mockResolvedValue(category);
      categoryRepo.save.mockResolvedValue({
        ...category,
        name: 'Updated',
      } as Category);

      const result = await service.update('user-id', 'cat-id', {
        name: 'Updated',
      });

      expect(categoryRepo.findOneBy).toHaveBeenCalledWith({
        id: 'cat-id',
        userId: 'user-id',
      });
      expect(result).toMatchObject({ name: 'Updated' });
    });

    it('throws NotFoundException when category not found', async () => {
      categoryRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('user-id', 'cat-id', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the category', async () => {
      const category = makeCategory();
      categoryRepo.findOneBy.mockResolvedValue(category);
      categoryRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove('user-id', 'cat-id');

      expect(categoryRepo.delete).toHaveBeenCalledWith('cat-id');
    });

    it('throws NotFoundException when category not found', async () => {
      categoryRepo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('user-id', 'cat-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
