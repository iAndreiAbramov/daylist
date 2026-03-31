import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import type { INote } from '@daylist/common/types/entities';
import { Note } from '@typeorm/entities';
import type { CreateNoteReqDto } from '../dto/req/create-note-req.dto';
import type { FilterNotesReqDto } from '../dto/req/filter-notes-req.dto';
import type { UpdateNoteReqDto } from '../dto/req/update-note-req.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepo: Repository<Note>,
  ) {}

  findAll(userId: string, filters: FilterNotesReqDto): Promise<INote[]> {
    const where: FindOptionsWhere<Note> = { userId };
    if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
    if (filters.taskId !== undefined) where.taskId = filters.taskId;
    if (filters.financeEntryId !== undefined)
      where.financeEntryId = filters.financeEntryId;
    return this.noteRepo.find({ where });
  }

  async create(userId: string, dto: CreateNoteReqDto): Promise<INote> {
    const note = this.noteRepo.create({ ...dto, userId });
    return this.noteRepo.save(note);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateNoteReqDto,
  ): Promise<INote> {
    const note = await this.noteRepo.findOneBy({ id, userId });
    if (!note) throw new NotFoundException();
    Object.assign(note, dto);
    return this.noteRepo.save(note);
  }

  async remove(userId: string, id: string): Promise<void> {
    const note = await this.noteRepo.findOneBy({ id, userId });
    if (!note) throw new NotFoundException();
    await this.noteRepo.delete(id);
  }
}
