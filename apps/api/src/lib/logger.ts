import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : isProduction ? 'info' : 'debug',
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }),
});

// --- Child Loggers ---

export const aiLogger = logger.child({ module: 'ai' });
export const dbLogger = logger.child({ module: 'database' });
export const authLogger = logger.child({ module: 'auth' });
