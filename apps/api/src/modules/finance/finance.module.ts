import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, FinanceEntry } from '@typeorm/entities';
import { FinanceController } from './finance.controller';
import { FinanceService } from './services/finance.service';

@Module({
  imports: [TypeOrmModule.forFeature([FinanceEntry, Category])],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
