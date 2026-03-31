import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PositionItemReqDto } from './position-item-req.dto';

export class UpdatePositionsReqDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PositionItemReqDto)
  positions!: PositionItemReqDto[];
}
