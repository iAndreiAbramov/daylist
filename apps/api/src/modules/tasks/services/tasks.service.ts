import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, IsNull, Repository } from 'typeorm';
import type { ITask } from '@daylist/common/types/entities';
import { Task } from '@typeorm/entities';
import type { CreateTaskReqDto } from '../dto/req/create-task-req.dto';
import type { FilterTasksReqDto } from '../dto/req/filter-tasks-req.dto';
import type { UpdatePositionsReqDto } from '../dto/req/update-positions-req.dto';
import type { UpdateTaskReqDto } from '../dto/req/update-task-req.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
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
    Object.assign(task, dto);
    return this.taskRepo.save(task);
  }

  async remove(userId: string, id: string): Promise<void> {
    const task = await this.taskRepo.findOneBy({ id, userId });
    if (!task) throw new NotFoundException();
    await this.taskRepo.delete(id);
  }

  async updatePositions(
    userId: string,
    dto: UpdatePositionsReqDto,
  ): Promise<void> {
    const ids = dto.positions.map((p) => p.id);
    const tasks = await this.taskRepo.findBy({ id: In(ids), userId });
    if (tasks.length !== ids.length) throw new NotFoundException();

    const positionMap = new Map(dto.positions.map((p) => [p.id, p.position]));
    for (const task of tasks) {
      task.position = positionMap.get(task.id)!;
    }
    await this.taskRepo.save(tasks);
  }
}
