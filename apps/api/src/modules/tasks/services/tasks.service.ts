import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, IsNull, Repository } from 'typeorm';
import { CategoryTypeEnum } from '@daylist/common';
import type { ITask } from '@daylist/common/types/entities';
import { Category, Task } from '@typeorm/entities';
import type { CreateTaskReqDto } from '../dto/req/create-task-req.dto';
import type { FilterTasksReqDto } from '../dto/req/filter-tasks-req.dto';
import type { UpdatePositionsReqDto } from '../dto/req/update-positions-req.dto';
import type { UpdateTaskReqDto } from '../dto/req/update-task-req.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  findAll(userId: string, filters: FilterTasksReqDto): Promise<ITask[]> {
    const where: FindOptionsWhere<Task> = { userId };
    if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId === null ? IsNull() : filters.parentId;
    }
    return this.taskRepo.find({ where, order: { position: 'ASC' } });
  }

  async create(userId: string, dto: CreateTaskReqDto): Promise<ITask> {
    const category = await this.categoryRepo.findOneBy({
      id: dto.categoryId,
      userId,
    });
    if (!category || category.type !== CategoryTypeEnum.Task) {
      throw new BadRequestException('Invalid category');
    }
    if (dto.parentId) {
      const parent = await this.taskRepo.findOneBy({
        id: dto.parentId,
        userId,
      });
      if (!parent) throw new BadRequestException('Invalid parent task');
    }
    const task = this.taskRepo.create({ ...dto, userId });
    return this.taskRepo.save(task);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTaskReqDto,
  ): Promise<ITask> {
    const task = await this.taskRepo.findOneBy({ id, userId });
    if (!task) throw new NotFoundException();
    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findOneBy({
        id: dto.categoryId,
        userId,
      });
      if (!category || category.type !== CategoryTypeEnum.Task) {
        throw new BadRequestException('Invalid category');
      }
    }
    if (dto.parentId !== undefined && dto.parentId !== null) {
      const parent = await this.taskRepo.findOneBy({
        id: dto.parentId,
        userId,
      });
      if (!parent) throw new BadRequestException('Invalid parent task');
    }
    Object.assign(task, dto);
    return this.taskRepo.save(task);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.taskRepo.delete({ id, userId });
    if (!result.affected) throw new NotFoundException();
  }

  async updatePositions(
    userId: string,
    dto: UpdatePositionsReqDto,
  ): Promise<void> {
    const ids = dto.positions.map((p) => p.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      throw new BadRequestException('Duplicate position items');
    }
    const tasks = await this.taskRepo.findBy({ id: In(ids), userId });
    if (tasks.length !== uniqueIds.size) throw new NotFoundException();

    const positionMap = new Map(dto.positions.map((p) => [p.id, p.position]));
    for (const task of tasks) {
      task.position = positionMap.get(task.id)!;
    }
    await this.taskRepo.save(tasks);
  }
}
