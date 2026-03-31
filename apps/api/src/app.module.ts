import { AuthModule } from '@modules/auth/auth.module';
import { CategoriesModule } from '@modules/categories/categories.module';
import { DatabaseModule } from '@modules/database/database.module';
import { FinanceAnalyticsModule } from '@modules/finance-analytics/finance-analytics.module';
import { FinanceModule } from '@modules/finance/finance.module';
import { LoggerModule } from '@modules/logger/logger.module';
import { NotesModule } from '@modules/notes/notes.module';
import { TasksModule } from '@modules/tasks/tasks.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AllExceptionsFilter } from '@lib/filters/all-exceptions.filter';
import { HttpExceptionFilter } from '@lib/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    LoggerModule,
    DatabaseModule,
    AuthModule,
    CategoriesModule,
    TasksModule,
    NotesModule,
    FinanceModule,
    FinanceAnalyticsModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // order matters: HttpExceptionFilter should be after AllExceptionsFilter to catch HttpExceptions first
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
