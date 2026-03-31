import { PartialType } from '@nestjs/mapped-types';
import { CreateNoteReqDto } from './create-note-req.dto';

export class UpdateNoteReqDto extends PartialType(CreateNoteReqDto) {}
