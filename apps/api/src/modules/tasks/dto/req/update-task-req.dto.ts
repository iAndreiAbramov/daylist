import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskReqDto } from './create-task-req.dto';

export class UpdateTaskReqDto extends PartialType(CreateTaskReqDto) {}
