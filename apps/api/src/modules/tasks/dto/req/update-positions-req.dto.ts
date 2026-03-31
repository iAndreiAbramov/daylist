import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { PositionItemReqDto } from './position-item-req.dto';

export class UpdatePositionsReqDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PositionItemReqDto)
  positions!: PositionItemReqDto[];
}
