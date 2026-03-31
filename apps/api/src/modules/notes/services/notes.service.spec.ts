import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryTypeEnum, FinanceEntryTypeEnum } from '@daylist/common';
import { Category, FinanceEntry, Note, Task } from '@typeorm/entities';
import { NotesService } from './notes.service';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-id',
    userId: 'user-id',
    categoryId: 'cat-id',
    title: 'Test note',
    content: '',
    taskId: null,
    financeEntryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Note;
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-id',
    userId: 'user-id',
    name: 'Test category',
    type: CategoryTypeEnum.Note,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Category;
}

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

function makeFinanceEntry(overrides: Partial<FinanceEntry> = {}): FinanceEntry {
  return {
    id: 'entry-id',
    userId: 'user-id',
    categoryId: 'cat-id',
    amount: 100,
    type: FinanceEntryTypeEnum.Expense,
    description: null,
    date: new Date(),
    currency: 'RUB',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as FinanceEntry;
}

describe('NotesService', () => {
  let service: NotesService;
  let noteRepo: jest.Mocked<
    Pick<Repository<Note>, 'find' | 'findOneBy' | 'create' | 'save' | 'delete'>
  >;
  let categoryRepo: jest.Mocked<Pick<Repository<Category>, 'findOneBy'>>;
  let taskRepo: jest.Mocked<Pick<Repository<Task>, 'findOneBy'>>;
  let financeEntryRepo: jest.Mocked<
    Pick<Repository<FinanceEntry>, 'findOneBy'>
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: getRepositoryToken(Note),
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
          useValue: { findOneBy: jest.fn() },
        },
        {
          provide: getRepositoryToken(Task),
          useValue: { findOneBy: jest.fn() },
        },
        {
          provide: getRepositoryToken(FinanceEntry),
          useValue: { findOneBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(NotesService);
    noteRepo = module.get(getRepositoryToken(Note));
    categoryRepo = module.get(getRepositoryToken(Category));
    taskRepo = module.get(getRepositoryToken(Task));
    financeEntryRepo = module.get(getRepositoryToken(FinanceEntry));
  });

  describe('findAll', () => {
    it('returns all notes for user without filters', async () => {
      const notes = [makeNote()];
      noteRepo.find.mockResolvedValue(notes);

      const result = await service.findAll('user-id', {});

      expect(noteRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(notes);
    });

    it('filters by categoryId, taskId, financeEntryId when provided', async () => {
      noteRepo.find.mockResolvedValue([]);

      await service.findAll('user-id', {
        categoryId: 'cat-id',
        taskId: 'task-id',
        financeEntryId: 'entry-id',
      });

      expect(noteRepo.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          categoryId: 'cat-id',
          taskId: 'task-id',
          financeEntryId: 'entry-id',
        },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('creates and returns a note', async () => {
      const note = makeNote();
      categoryRepo.findOneBy.mockResolvedValue(makeCategory());
      noteRepo.create.mockReturnValue(note);
      noteRepo.save.mockResolvedValue(note);

      const result = await service.create('user-id', {
        categoryId: 'cat-id',
        title: 'Test note',
      });

      expect(noteRepo.create).toHaveBeenCalledWith({
        categoryId: 'cat-id',
        title: 'Test note',
        userId: 'user-id',
      });
      expect(result).toEqual(note);
    });

    it('creates successfully with valid taskId and financeEntryId', async () => {
      const note = makeNote({ taskId: 'task-id', financeEntryId: 'entry-id' });
      categoryRepo.findOneBy.mockResolvedValue(makeCategory());
      taskRepo.findOneBy.mockResolvedValue(makeTask());
      financeEntryRepo.findOneBy.mockResolvedValue(makeFinanceEntry());
      noteRepo.create.mockReturnValue(note);
      noteRepo.save.mockResolvedValue(note);

      const result = await service.create('user-id', {
        categoryId: 'cat-id',
        title: 'Test note',
        taskId: 'task-id',
        financeEntryId: 'entry-id',
      });

      expect(taskRepo.findOneBy).toHaveBeenCalledWith({
        id: 'task-id',
        userId: 'user-id',
      });
      expect(financeEntryRepo.findOneBy).toHaveBeenCalledWith({
        id: 'entry-id',
        userId: 'user-id',
      });
      expect(result).toEqual(note);
    });

    it('throws BadRequestException when category does not belong to user', async () => {
      categoryRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.create('user-id', { categoryId: 'cat-id', title: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when category has wrong type', async () => {
      categoryRepo.findOneBy.mockResolvedValue(
        makeCategory({ type: CategoryTypeEnum.Task }),
      );

      await expect(
        service.create('user-id', { categoryId: 'cat-id', title: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when taskId does not belong to user', async () => {
      categoryRepo.findOneBy.mockResolvedValue(makeCategory());
      taskRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.create('user-id', {
          categoryId: 'cat-id',
          title: 'Test',
          taskId: 'task-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when financeEntryId does not belong to user', async () => {
      categoryRepo.findOneBy.mockResolvedValue(makeCategory());
      financeEntryRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.create('user-id', {
          categoryId: 'cat-id',
          title: 'Test',
          financeEntryId: 'entry-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates and returns the note', async () => {
      const note = makeNote();
      noteRepo.findOneBy.mockResolvedValue(note);
      noteRepo.save.mockResolvedValue({ ...note, title: 'Updated' } as Note);

      const result = await service.update('user-id', 'note-id', {
        title: 'Updated',
      });

      expect(noteRepo.findOneBy).toHaveBeenCalledWith({
        id: 'note-id',
        userId: 'user-id',
      });
      expect(result).toMatchObject({ title: 'Updated' });
    });

    it('allows setting taskId and financeEntryId to null', async () => {
      const note = makeNote({ taskId: 'task-id', financeEntryId: 'entry-id' });
      noteRepo.findOneBy.mockResolvedValue(note);
      noteRepo.save.mockResolvedValue({
        ...note,
        taskId: null,
        financeEntryId: null,
      } as Note);

      const result = await service.update('user-id', 'note-id', {
        taskId: null,
        financeEntryId: null,
      });

      expect(result).toMatchObject({ taskId: null, financeEntryId: null });
    });

    it('throws NotFoundException when note not found', async () => {
      noteRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('user-id', 'note-id', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when new categoryId does not belong to user', async () => {
      noteRepo.findOneBy.mockResolvedValue(makeNote());
      categoryRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('user-id', 'note-id', { categoryId: 'new-cat-id' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when new categoryId has wrong type', async () => {
      noteRepo.findOneBy.mockResolvedValue(makeNote());
      categoryRepo.findOneBy.mockResolvedValue(
        makeCategory({ type: CategoryTypeEnum.Task }),
      );

      await expect(
        service.update('user-id', 'note-id', { categoryId: 'new-cat-id' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when new taskId does not belong to user', async () => {
      noteRepo.findOneBy.mockResolvedValueOnce(makeNote());
      taskRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('user-id', 'note-id', { taskId: 'missing-task' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when new financeEntryId does not belong to user', async () => {
      noteRepo.findOneBy.mockResolvedValueOnce(makeNote());
      financeEntryRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('user-id', 'note-id', {
          financeEntryId: 'missing-entry',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deletes the note atomically by id and userId', async () => {
      noteRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove('user-id', 'note-id');

      expect(noteRepo.delete).toHaveBeenCalledWith({
        id: 'note-id',
        userId: 'user-id',
      });
    });

    it('throws NotFoundException when note not found', async () => {
      noteRepo.delete.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.remove('user-id', 'note-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
