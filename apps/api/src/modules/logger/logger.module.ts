import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { ClsModule } from 'nestjs-cls';
import { loggerConfig } from '@lib/config/logger.config';
import { AppConsoleLogger } from './app-console-logger';
import { ClsKeyEnum } from './enums/cls-key.enum';
import { HttpLoggerInterceptor } from './http-logger.interceptor';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(loggerConfig),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls) => {
          cls.set(ClsKeyEnum.ReqId, randomUUID().slice(0, 8));
          cls.set(ClsKeyEnum.ReqTimestamp, Date.now());
        },
      },
    }),
  ],
  providers: [
    AppConsoleLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggerInterceptor,
    },
  ],
  exports: [AppConsoleLogger],
})
export class LoggerModule {}
