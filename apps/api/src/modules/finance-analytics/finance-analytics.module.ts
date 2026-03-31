import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceEntry } from '@typeorm/entities';
import { FinanceAnalyticsController } from './finance-analytics.controller';
import { FinanceAnalyticsService } from './services/finance-analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([FinanceEntry])],
  controllers: [FinanceAnalyticsController],
  providers: [FinanceAnalyticsService],
})
export class FinanceAnalyticsModule {}
