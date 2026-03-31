import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from '@typeorm/entities';
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

describe('NotesService', () => {
  let service: NotesService;
  let noteRepo: jest.Mocked<
    Pick<Repository<Note>, 'find' | 'findOneBy' | 'create' | 'save' | 'delete'>
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
      ],
    }).compile();

    service = module.get(NotesService);
    noteRepo = module.get(getRepositoryToken(Note));
  });

  describe('findAll', () => {
    it('returns all notes for user without filters', async () => {
      const notes = [makeNote()];
      noteRepo.find.mockResolvedValue(notes);

      const result = await service.findAll('user-id', {});

      expect(noteRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
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
      });
    });
  });

  describe('create', () => {
    it('creates and returns a note', async () => {
      const note = makeNote();
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

    it('throws NotFoundException when note not found', async () => {
      noteRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('user-id', 'note-id', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the note', async () => {
      noteRepo.findOneBy.mockResolvedValue(makeNote());
      noteRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove('user-id', 'note-id');

      expect(noteRepo.delete).toHaveBeenCalledWith('note-id');
    });

    it('throws NotFoundException when note not found', async () => {
      noteRepo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('user-id', 'note-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
