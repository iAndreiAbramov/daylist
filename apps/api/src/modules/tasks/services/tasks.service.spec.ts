import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Task } from '@typeorm/entities';
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

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: jest.Mocked<
    Pick<
      Repository<Task>,
      'find' | 'findBy' | 'findOneBy' | 'create' | 'save' | 'delete'
    >
  >;

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
      ],
    }).compile();

    service = module.get(TasksService);
    taskRepo = module.get(getRepositoryToken(Task));
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

    it('throws NotFoundException when task not found', async () => {
      taskRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('user-id', 'task-id', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the task', async () => {
      taskRepo.findOneBy.mockResolvedValue(makeTask());
      taskRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove('user-id', 'task-id');

      expect(taskRepo.delete).toHaveBeenCalledWith('task-id');
    });

    it('throws NotFoundException when task not found', async () => {
      taskRepo.findOneBy.mockResolvedValue(null);

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
