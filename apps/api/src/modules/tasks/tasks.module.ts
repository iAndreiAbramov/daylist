import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, Task } from '@typeorm/entities';
import { TasksService } from './services/tasks.service';
import { TasksController } from './tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Category])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
