import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, FinanceEntry, Note, Task } from '@typeorm/entities';
import { NotesController } from './notes.controller';
import { NotesService } from './services/notes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Note, Category, Task, FinanceEntry])],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
