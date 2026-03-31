import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryReqDto } from './create-category-req.dto';

export class UpdateCategoryReqDto extends PartialType(CreateCategoryReqDto) {}
