import type { JwtUser } from '@modules/auth/strategies/jwt.strategy';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@lib/decorators/current-user.decorator';
import { JwtAuthGuard } from '@lib/guards/jwt-auth.guard';
import { CreateTaskReqDto } from './dto/req/create-task-req.dto';
import { FilterTasksReqDto } from './dto/req/filter-tasks-req.dto';
import { UpdatePositionsReqDto } from './dto/req/update-positions-req.dto';
import { UpdateTaskReqDto } from './dto/req/update-task-req.dto';
import { TaskResDto } from './dto/res/task-res.dto';
import { TasksService } from './services/tasks.service';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @SerializeOptions({ type: TaskResDto })
  findAll(
    @CurrentUser() user: JwtUser,
    @Query() query: FilterTasksReqDto,
  ): Promise<TaskResDto[]> {
    return this.tasksService.findAll(user.id, query);
  }

  @Post()
  @SerializeOptions({ type: TaskResDto })
  create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateTaskReqDto,
  ): Promise<TaskResDto> {
    return this.tasksService.create(user.id, dto);
  }

  // declared before /:id to avoid route conflict
  @Patch('positions')
  @HttpCode(HttpStatus.NO_CONTENT)
  updatePositions(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdatePositionsReqDto,
  ): Promise<void> {
    return this.tasksService.updatePositions(user.id, dto);
  }

  @Patch(':id')
  @SerializeOptions({ type: TaskResDto })
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskReqDto,
  ): Promise<TaskResDto> {
    return this.tasksService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string): Promise<void> {
    return this.tasksService.remove(user.id, id);
  }
}
