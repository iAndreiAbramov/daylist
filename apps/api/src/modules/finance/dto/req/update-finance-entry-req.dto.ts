import { PartialType } from '@nestjs/mapped-types';
import { CreateFinanceEntryReqDto } from './create-finance-entry-req.dto';

export class UpdateFinanceEntryReqDto extends PartialType(
  CreateFinanceEntryReqDto,
) {}
