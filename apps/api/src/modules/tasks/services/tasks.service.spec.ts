import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CategoryTypeEnum } from '@daylist/common';
import { Category, Task } from '@typeorm/entities';
import { TasksService } from './tasks.service';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-id',
    userId: 'user-id',
    categoryId: 'cat-id',
    parentId: null,
    title: 'Test task',
    completed: false,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Task;
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-id',
    userId: 'user-id',
    name: 'Test category',
    type: CategoryTypeEnum.Task,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Category;
}

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: jest.Mocked<
    Pick<
      Repository<Task>,
      'find' | 'findBy' | 'findOneBy' | 'create' | 'save' | 'delete'
    >
  >;
  let categoryRepo: jest.Mocked<Pick<Repository<Category>, 'findOneBy'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            find: jest.fn(),
            findBy: jest.fn(),
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
      ],
    }).compile();

    service = module.get(TasksService);
    taskRepo = module.get(getRepositoryToken(Task));
    categoryRepo = module.get(getRepositoryToken(Category));
  });

  describe('findAll', () => {
    it('returns all tasks for user without filters', async () => {
      const tasks = [makeTask()];
      taskRepo.find.mockResolvedValue(tasks);

      const result = await service.findAll('user-id', {});

      expect(taskRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        order: { position: 'ASC' },
      });
      expect(result).toEqual(tasks);
    });

    it('filters by categoryId when provided', async () => {
      taskRepo.find.mockResolvedValue([]);

      await service.findAll('user-id', { categoryId: 'cat-id' });

      expect(taskRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-id', categoryId: 'cat-id' },
        order: { position: 'ASC' },
      });
    });

    it('filters by parentId=null to get root tasks', async () => {
      taskRepo.find.mockResolvedValue([]);

      await service.findAll('user-id', { parentId: null });

      expect(taskRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-id', parentId: IsNull() },
        order: { position: 'ASC' },
      });
    });

    it('filters by parentId UUID to get subtasks', async () => {
      taskRepo.find.mockResolvedValue([]);

      await service.findAll('user-id', { parentId: 'parent-id' });

      expect(taskRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-id', parentId: 'parent-id' },
        order: { position: 'ASC' },
      });
    });
  });

  describe('create', () => {
    it('creates and returns a task', async () => {
      const task = makeTask();
      categoryRepo.findOneBy.mockResolvedValue(makeCategory());
      taskRepo.create.mockReturnValue(task);
      taskRepo.save.mockResolvedValue(task);

      const result = await service.create('user-id', {
        categoryId: 'cat-id',
        title: 'Test task',
      });

      expect(taskRepo.create).toHaveBeenCalledWith({
        categoryId: 'cat-id',
        title: 'Test task',
        userId: 'user-id',
      });
      expect(result).toEqual(task);
    });

    it('creates successfully with valid parentId', async () => {
      const task = makeTask({ parentId: 'parent-id' });
      categoryRepo.findOneBy.mockResolvedValue(makeCategory());
      taskRepo.findOneBy.mockResolvedValue(makeTask({ id: 'parent-id' }));
      taskRepo.create.mockReturnValue(task);
      taskRepo.save.mockResolvedValue(task);

      const result = await service.create('user-id', {
        categoryId: 'cat-id',
        title: 'Test task',
        parentId: 'parent-id',
      });

      expect(taskRepo.findOneBy).toHaveBeenCalledWith({
        id: 'parent-id',
        userId: 'user-id',
      });
      expect(result).toEqual(task);
    });

    it('throws BadRequestException when category does not belong to user', async () => {
      categoryRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.create('user-id', { categoryId: 'cat-id', title: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when category has wrong type', async () => {
      categoryRepo.findOneBy.mockResolvedValue(
        makeCategory({ type: CategoryTypeEnum.Finance }),
      );

      await expect(
        service.create('user-id', { categoryId: 'cat-id', title: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when parentId task does not belong to user', async () => {
      categoryRepo.findOneBy.mockResolvedValue(makeCategory());
      taskRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.create('user-id', {
          categoryId: 'cat-id',
          title: 'Test',
          parentId: 'parent-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates and returns the task', async () => {
      const task = makeTask();
      taskRepo.findOneBy.mockResolvedValue(task);
      taskRepo.save.mockResolvedValue({ ...task, title: 'Updated' } as Task);

      const result = await service.update('user-id', 'task-id', {
        title: 'Updated',
      });

      expect(taskRepo.findOneBy).toHaveBeenCalledWith({
        id: 'task-id',
        userId: 'user-id',
      });
      expect(result).toMatchObject({ title: 'Updated' });
    });

    it('allows setting parentId to null', async () => {
      const task = makeTask({ parentId: 'old-parent' });
      taskRepo.findOneBy.mockResolvedValue(task);
      taskRepo.save.mockResolvedValue({ ...task, parentId: null } as Task);

      const result = await service.update('user-id', 'task-id', {
        parentId: null,
      });

      expect(result).toMatchObject({ parentId: null });
    });

    it('throws NotFoundException when task not found', async () => {
      taskRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('user-id', 'task-id', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when new categoryId does not belong to user', async () => {
      taskRepo.findOneBy.mockResolvedValue(makeTask());
      categoryRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('user-id', 'task-id', { categoryId: 'new-cat-id' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when new categoryId has wrong type', async () => {
      taskRepo.findOneBy.mockResolvedValue(makeTask());
      categoryRepo.findOneBy.mockResolvedValue(
        makeCategory({ type: CategoryTypeEnum.Finance }),
      );

      await expect(
        service.update('user-id', 'task-id', { categoryId: 'new-cat-id' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when new parentId does not belong to user', async () => {
      taskRepo.findOneBy.mockResolvedValueOnce(makeTask());
      taskRepo.findOneBy.mockResolvedValueOnce(null);

      await expect(
        service.update('user-id', 'task-id', { parentId: 'missing-parent' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deletes the task atomically by id and userId', async () => {
      taskRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove('user-id', 'task-id');

      expect(taskRepo.delete).toHaveBeenCalledWith({
        id: 'task-id',
        userId: 'user-id',
      });
    });

    it('throws NotFoundException when task not found', async () => {
      taskRepo.delete.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.remove('user-id', 'task-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePositions', () => {
    it('updates positions for all tasks', async () => {
      const tasks = [
        makeTask({ id: 'task-1' }),
        makeTask({ id: 'task-2', position: 1 }),
      ];
      taskRepo.findBy.mockResolvedValue(tasks);
      taskRepo.save.mockResolvedValue(tasks as unknown as Task);

      await service.updatePositions('user-id', {
        positions: [
          { id: 'task-1', position: 1 },
          { id: 'task-2', position: 0 },
        ],
      });

      expect(tasks[0].position).toBe(1);
      expect(tasks[1].position).toBe(0);
      expect(taskRepo.save).toHaveBeenCalledWith(tasks);
    });

    it('throws BadRequestException on duplicate ids', async () => {
      await expect(
        service.updatePositions('user-id', {
          positions: [
            { id: 'task-1', position: 0 },
            { id: 'task-1', position: 1 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when any task is not found', async () => {
      taskRepo.findBy.mockResolvedValue([makeTask({ id: 'task-1' })]);

      await expect(
        service.updatePositions('user-id', {
          positions: [
            { id: 'task-1', position: 0 },
            { id: 'task-missing', position: 1 },
          ],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
