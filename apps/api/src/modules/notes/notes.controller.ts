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
import { CreateNoteReqDto } from './dto/req/create-note-req.dto';
import { FilterNotesReqDto } from './dto/req/filter-notes-req.dto';
import { UpdateNoteReqDto } from './dto/req/update-note-req.dto';
import { NoteResDto } from './dto/res/note-res.dto';
import { NotesService } from './services/notes.service';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @SerializeOptions({ type: NoteResDto })
  findAll(
    @CurrentUser() user: JwtUser,
    @Query() query: FilterNotesReqDto,
  ): Promise<NoteResDto[]> {
    return this.notesService.findAll(user.id, query);
  }

  @Post()
  @SerializeOptions({ type: NoteResDto })
  create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateNoteReqDto,
  ): Promise<NoteResDto> {
    return this.notesService.create(user.id, dto);
  }

  @Patch(':id')
  @SerializeOptions({ type: NoteResDto })
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateNoteReqDto,
  ): Promise<NoteResDto> {
    return this.notesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string): Promise<void> {
    return this.notesService.remove(user.id, id);
  }
}
