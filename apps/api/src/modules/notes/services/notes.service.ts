import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CategoryTypeEnum } from '@daylist/common';
import type { INote } from '@daylist/common/types/entities';
import { Category, FinanceEntry, Note, Task } from '@typeorm/entities';
import type { CreateNoteReqDto } from '../dto/req/create-note-req.dto';
import type { FilterNotesReqDto } from '../dto/req/filter-notes-req.dto';
import type { UpdateNoteReqDto } from '../dto/req/update-note-req.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepo: Repository<Note>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(FinanceEntry)
    private readonly financeEntryRepo: Repository<FinanceEntry>,
  ) {}

  findAll(userId: string, filters: FilterNotesReqDto): Promise<INote[]> {
    const where: FindOptionsWhere<Note> = { userId };
    if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
    if (filters.taskId !== undefined) where.taskId = filters.taskId;
    if (filters.financeEntryId !== undefined)
      where.financeEntryId = filters.financeEntryId;
    return this.noteRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async create(userId: string, dto: CreateNoteReqDto): Promise<INote> {
    const category = await this.categoryRepo.findOneBy({
      id: dto.categoryId,
      userId,
    });
    if (!category || category.type !== CategoryTypeEnum.Note) {
      throw new BadRequestException('Invalid category');
    }
    if (dto.taskId) {
      const task = await this.taskRepo.findOneBy({ id: dto.taskId, userId });
      if (!task) throw new BadRequestException('Invalid task');
    }
    if (dto.financeEntryId) {
      const entry = await this.financeEntryRepo.findOneBy({
        id: dto.financeEntryId,
        userId,
      });
      if (!entry) throw new BadRequestException('Invalid finance entry');
    }
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
    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findOneBy({
        id: dto.categoryId,
        userId,
      });
      if (!category || category.type !== CategoryTypeEnum.Note) {
        throw new BadRequestException('Invalid category');
      }
    }
    if (dto.taskId !== undefined && dto.taskId !== null) {
      const task = await this.taskRepo.findOneBy({ id: dto.taskId, userId });
      if (!task) throw new BadRequestException('Invalid task');
    }
    if (dto.financeEntryId !== undefined && dto.financeEntryId !== null) {
      const entry = await this.financeEntryRepo.findOneBy({
        id: dto.financeEntryId,
        userId,
      });
      if (!entry) throw new BadRequestException('Invalid finance entry');
    }
    Object.assign(note, dto);
    return this.noteRepo.save(note);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.noteRepo.delete({ id, userId });
    if (!result.affected) throw new NotFoundException();
  }
}
