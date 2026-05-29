import type { MiddlewareHandler } from 'hono';
import { logger } from '../lib/logger';

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
  }
}

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const requestId = c.req.header('x-request-id') ?? crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);

  const start = performance.now();

  await next();

  const duration = Math.round(performance.now() - start);
  const status = c.res.status;
  const method = c.req.method;
  const path = c.req.path;

  const logData = {
    requestId,
    method,
    path,
    status,
    duration: `${duration}ms`,
  };

  if (status >= 500) {
    logger.error(logData, 'Request completed');
  } else if (status >= 400) {
    logger.warn(logData, 'Request completed');
  } else {
    logger.info(logData, 'Request completed');
  }
};
