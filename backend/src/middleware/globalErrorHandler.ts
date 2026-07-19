// middleware/errorHandler.js
import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";

const handlePrismaError = (err: Error & { code?: string; meta?: Record<string, unknown> }) => {
  if (err.code === "P2002") {
    const target = err.meta?.target;
    const field = Array.isArray(target) ? target[0] : undefined;

    return new AppError({
      message: "Duplicate field value",
      statusCode: 409,
      type: "DUPLICATE_RESOURCE",
      details: field ? [{ field, message: "Already exists" }] : null,
    });
  }

  if (err.code === "P2025") {
    return new AppError({
      message: "Resource not found",
      statusCode: 404,
      type: "NOT_FOUND",
    });
  }

  return err;
};

const normalizeError = (err: unknown) => {
  if (err instanceof AppError) return err;

  return new AppError({
    message: err instanceof Error ? err.message : String(err),
    statusCode: 500,
    type: "INTERNAL_ERROR",
    isOperational: false,
  });
};

const sendResponse = (err: AppError, res: Response, req: Request) => {
  res.status(err.statusCode).json({
    success: false,
    type: err.type,
    message: err.message,
    details: err.details,
    requestId: req.id,
  });
};

const logError = (err: AppError, req: Request) => {
  const log = {
    level: err.isOperational ? "warn" : "error",
    message: err.message,
    type: err.type,
    statusCode: err.statusCode,
    path: req.originalUrl,
    method: req.method,
    details: err.details,
    requestId: req.id,
    stack: err.isOperational ? undefined : err.stack,
  };

  console.error(JSON.stringify(log));
};

export const globalErrorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  let error: unknown = err;

  // Prisma errors
  const errWithCode = error as Record<string, unknown>;
  if (typeof errWithCode?.code === 'string' && errWithCode.code.startsWith("P")) {
    error = handlePrismaError(error as Error & { code?: string; meta?: Record<string, unknown> });
  }

  // Normalize unknown errors
  const normalized = normalizeError(error);

  
  // Log
  logError(normalized, req);

  // Respond
  sendResponse(normalized, res, req);
};
