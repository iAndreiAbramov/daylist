import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryTypeEnum } from '@daylist/common';
import type { ICategory } from '@daylist/common/types/entities';
import { Category } from '@typeorm/entities';
import type { CreateCategoryReqDto } from '../dto/req/create-category-req.dto';
import type { UpdateCategoryReqDto } from '../dto/req/update-category-req.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  findAll(userId: string, type?: CategoryTypeEnum): Promise<ICategory[]> {
    return this.categoryRepo.find({
      where: { userId, ...(type !== undefined && { type }) },
      order: { position: 'ASC' },
    });
  }

  async create(userId: string, dto: CreateCategoryReqDto): Promise<ICategory> {
    const category = this.categoryRepo.create({ ...dto, userId });
    return this.categoryRepo.save(category);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryReqDto,
  ): Promise<ICategory> {
    const category = await this.categoryRepo.findOneBy({ id, userId });
    if (!category) throw new NotFoundException();
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.categoryRepo.delete({ id, userId });
    if (!result.affected) throw new NotFoundException();
  }
}
