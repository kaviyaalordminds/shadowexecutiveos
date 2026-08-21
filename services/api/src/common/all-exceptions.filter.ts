import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { randomUUID } from "crypto";

/**
 * Structured error handling (spec section 45): every error gets an id,
 * timestamp, and a user-safe message. Technical details are logged
 * server-side only and never leaked in the HTTP response body.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorId = randomUUID();
    const timestamp = new Date().toISOString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let userMessage = "Something went wrong. Please try again.";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      userMessage =
        typeof body === "string"
          ? body
          : (body as any)?.message ?? exception.message;
    }

    const exceptionType =
      exception instanceof Error ? exception.constructor.name : typeof exception;
    // pg driver errors (connection failures, constraint violations, etc.)
    // carry a Postgres error `code` that plain HttpExceptions don't — log
    // it explicitly so "database unreachable" is obvious without having to
    // parse the stack trace.
    const pgCode = (exception as { code?: string } | null)?.code;
    const dbErrorNote = pgCode ? ` pgErrorCode=${pgCode}` : "";

    this.logger.error(
      `errorId=${errorId} op=${request.method} ${request.url} status=${status} type=${exceptionType}${dbErrorNote}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      errorId,
      timestamp,
      service: "shadow-api",
      operation: `${request.method} ${request.url}`,
      message: userMessage,
    });
  }
}
