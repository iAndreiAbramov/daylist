import { AppConsoleLogger } from '@modules/logger/app-console-logger';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CategoryTypeEnum } from '@daylist/common';
import type { IFinanceEntry } from '@daylist/common/types/entities';
import { Category, FinanceEntry } from '@typeorm/entities';
import type { CreateFinanceEntryReqDto } from '../dto/req/create-finance-entry-req.dto';
import type { FilterFinanceEntriesReqDto } from '../dto/req/filter-finance-entries-req.dto';
import type { UpdateFinanceEntryReqDto } from '../dto/req/update-finance-entry-req.dto';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FinanceEntry)
    private readonly financeEntryRepo: Repository<FinanceEntry>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly logger: AppConsoleLogger,
  ) {}

  async findAll(
    userId: string,
    filters: FilterFinanceEntriesReqDto,
  ): Promise<IFinanceEntry[]> {
    const where: FindOptionsWhere<FinanceEntry> = { userId };
    if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
    if (filters.type !== undefined) where.type = filters.type;
    if (filters.from && filters.to) {
      if (new Date(filters.from).getTime() > new Date(filters.to).getTime()) {
        throw new BadRequestException(
          'from must be on or before the "to" date',
        );
      }
      where.date = And(
        MoreThanOrEqual(new Date(filters.from)),
        LessThanOrEqual(new Date(filters.to)),
      );
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
    const category = await this.categoryRepo.findOneBy({
      id: dto.categoryId,
      userId,
    });
    if (!category || category.type !== CategoryTypeEnum.Finance) {
      throw new BadRequestException('Invalid category');
    }
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
    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findOneBy({
        id: dto.categoryId,
        userId,
      });
      if (!category || category.type !== CategoryTypeEnum.Finance) {
        throw new BadRequestException('Invalid category');
      }
    }
    Object.assign(entry, dto);
    return this.financeEntryRepo.save(entry);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.financeEntryRepo.delete({ id, userId });
    if (!result.affected) throw new NotFoundException();
    this.logger.info(
      `Finance entry deleted: ${id}`,
      FinanceService.name,
      this.remove.name,
    );
  }
}
