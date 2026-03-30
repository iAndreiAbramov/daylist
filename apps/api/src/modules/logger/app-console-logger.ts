import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { ClsKeyEnum } from './enums/cls-key.enum';
import { LogLevelEnum } from './enums/log-level.enum';

const LogLevels = {
  [LogLevelEnum.FATAL]: [LogLevelEnum.FATAL],
  [LogLevelEnum.ERROR]: [LogLevelEnum.ERROR, LogLevelEnum.FATAL],
  [LogLevelEnum.WARNING]: [
    LogLevelEnum.WARNING,
    LogLevelEnum.ERROR,
    LogLevelEnum.FATAL,
  ],
  [LogLevelEnum.INFO]: [
    LogLevelEnum.INFO,
    LogLevelEnum.WARNING,
    LogLevelEnum.ERROR,
    LogLevelEnum.FATAL,
  ],
  [LogLevelEnum.DEBUG]: [
    LogLevelEnum.DEBUG,
    LogLevelEnum.INFO,
    LogLevelEnum.WARNING,
    LogLevelEnum.ERROR,
    LogLevelEnum.FATAL,
  ],
};

@Injectable()
export class AppConsoleLogger {
  private readonly logLevel: LogLevelEnum;

  constructor(
    private readonly cls: ClsService,
    private readonly configService: ConfigService,
  ) {
    this.logLevel =
      this.configService.getOrThrow<LogLevelEnum>('logger.logLevel');
  }

  debug(message: string, ...scope: string[]): void {
    if (!LogLevels[this.logLevel].includes(LogLevelEnum.DEBUG)) return;
    console.log(this.getMessage({ message, scope, level: LogLevelEnum.DEBUG }));
  }

  info(message: string, ...scope: string[]): void {
    if (!LogLevels[this.logLevel].includes(LogLevelEnum.INFO)) return;
    console.info(this.getMessage({ message, scope, level: LogLevelEnum.INFO }));
  }

  warn(message: string, ...scope: string[]): void {
    if (!LogLevels[this.logLevel].includes(LogLevelEnum.WARNING)) return;
    console.warn(
      this.getMessage({ message, scope, level: LogLevelEnum.WARNING }),
    );
  }

  error(message: string, ...scope: string[]): void {
    if (!LogLevels[this.logLevel].includes(LogLevelEnum.ERROR)) return;
    console.error(
      this.getMessage({ message, scope, level: LogLevelEnum.ERROR }),
    );
  }

  fatal(message: string, ...scope: string[]): void {
    if (!LogLevels[this.logLevel].includes(LogLevelEnum.FATAL)) return;
    console.error(
      this.getMessage({ message, scope, level: LogLevelEnum.FATAL }),
    );
  }

  log(message: string, ...scope: string[]): void {
    const globalContext = this.createGlobalContext();
    console.log(`${globalContext}${message} ${scope.join(' ')}`);
  }

  logResponse({
    statusCode,
    method,
    url,
    message = '',
  }: {
    statusCode: number;
    method: string;
    url: string;
    message?: string;
  }): void {
    const globalContext = this.createGlobalContext();
    const reqStartTimestamp = this.cls.get<number>(ClsKeyEnum.ReqTimestamp);
    const duration = Date.now() - reqStartTimestamp;
    console.log(
      `${globalContext}[RES][${method}] ${url} [${statusCode}] [${duration}ms] ${message}`,
    );
  }

  private createGlobalContext(): string {
    const userUuid = this.cls.get<string>(ClsKeyEnum.UserUuid) ?? 'anon';
    const reqId =
      this.cls.getId() || this.cls.get<string>(ClsKeyEnum.ReqId) || '';
    return `[${userUuid}][${reqId}]`;
  }

  private getMessage({
    message,
    level,
    scope,
  }: {
    message: string;
    level: LogLevelEnum;
    scope?: string[];
  }): string {
    const globalContext = this.createGlobalContext();
    const scopeString = scope?.length ? scope.join('.') : '';
    return scope?.length
      ? `${globalContext}[${level}] [${scopeString}] ${message}`
      : `${globalContext}[${level}] ${message}`;
  }
}
