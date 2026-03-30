import { AppConsoleLogger } from '@modules/logger/app-console-logger';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { STATUS_CODES } from 'http';

@Injectable()
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppConsoleLogger) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const statusCode = exception.getStatus();

    this.logger.logResponse({
      statusCode,
      method: req.method,
      url: req.originalUrl,
      message: exception.message,
    });

    const rawResponse = exception.getResponse();
    const isValidation =
      statusCode === Number(HttpStatus.BAD_REQUEST) &&
      typeof rawResponse === 'object' &&
      Array.isArray((rawResponse as Record<string, unknown>).message);

    const body = isValidation
      ? rawResponse
      : { statusCode, message: STATUS_CODES[statusCode] ?? 'Error' };

    res.status(statusCode).json(body);
  }
}
