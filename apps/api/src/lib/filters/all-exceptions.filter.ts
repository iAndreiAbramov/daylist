import { AppConsoleLogger } from '@modules/logger/app-console-logger';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppConsoleLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const message =
      exception instanceof Error ? exception.message : String(exception);

    this.logger.fatal(message, AllExceptionsFilter.name, this.catch.name);

    this.logger.logResponse({
      statusCode: 500,
      method: req.method,
      url: req.originalUrl,
      message,
    });

    const httpException = new InternalServerErrorException();
    res.status(500).json(httpException.getResponse());
  }
}
