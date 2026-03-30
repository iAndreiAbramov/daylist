import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { Observable, tap } from 'rxjs';
import { JwtUser } from '../auth/strategies/jwt.strategy';
import { AppConsoleLogger } from './app-console-logger';
import { ClsKeyEnum } from './enums/cls-key.enum';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor<
  unknown,
  unknown
> {
  constructor(
    private readonly clsService: ClsService,
    private readonly logger: AppConsoleLogger,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUser }>();
    const reqIp = req.ip;

    const userUuid = req.user?.id;

    if (userUuid) this.clsService.set(ClsKeyEnum.UserUuid, userUuid);
    if (req.originalUrl.includes('healthz')) {
      return next.handle();
    }

    this.logger.log(`[REQ][${req.method}] ${req.originalUrl} [${reqIp}]`);

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        this.logger.logResponse({
          statusCode: res.statusCode,
          method: req.method,
          url: req.originalUrl,
        });
      }),
    );
  }
}
