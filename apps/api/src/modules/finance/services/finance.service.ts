import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import type { IFinanceEntry } from '@daylist/common/types/entities';
import { FinanceEntry } from '@typeorm/entities';
import type { CreateFinanceEntryReqDto } from '../dto/req/create-finance-entry-req.dto';
import type { FilterFinanceEntriesReqDto } from '../dto/req/filter-finance-entries-req.dto';
import type { UpdateFinanceEntryReqDto } from '../dto/req/update-finance-entry-req.dto';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FinanceEntry)
    private readonly financeEntryRepo: Repository<FinanceEntry>,
  ) {}

  findAll(
    userId: string,
    filters: FilterFinanceEntriesReqDto,
  ): Promise<IFinanceEntry[]> {
    const where: FindOptionsWhere<FinanceEntry> = { userId };
    if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
    if (filters.type !== undefined) where.type = filters.type;
    if (filters.from && filters.to) {
      where.date = Between(new Date(filters.from), new Date(filters.to));
    } else if (filters.from) {
      where.date = MoreThanOrEqual(new Date(filters.from));
    } else if (filters.to) {
      where.date = LessThanOrEqual(new Date(filters.to));
    }
    return this.financeEntryRepo.find({ where, order: { date: 'DESC' } });
  }

  async create(
    userId: string,
    dto: CreateFinanceEntryReqDto,
  ): Promise<IFinanceEntry> {
    const entry = this.financeEntryRepo.create({ ...dto, userId });
    return this.financeEntryRepo.save(entry);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateFinanceEntryReqDto,
  ): Promise<IFinanceEntry> {
    const entry = await this.financeEntryRepo.findOneBy({ id, userId });
    if (!entry) throw new NotFoundException();
    Object.assign(entry, dto);
    return this.financeEntryRepo.save(entry);
  }

  async remove(userId: string, id: string): Promise<void> {
    const entry = await this.financeEntryRepo.findOneBy({ id, userId });
    if (!entry) throw new NotFoundException();
    await this.financeEntryRepo.delete(id);
  }
}
