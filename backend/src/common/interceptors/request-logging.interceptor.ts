import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();
    const path = request.path ?? request.url.split('?')[0];

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `${request.method} ${path} ${response.statusCode} ${Date.now() - startedAt}ms`,
        );
      }),
      catchError((error: unknown) => {
        this.logger.error(
          `${request.method} ${path} failed after ${Date.now() - startedAt}ms`,
          error instanceof Error ? error.stack : String(error),
        );

        return throwError(() => error);
      }),
    );
  }
}
