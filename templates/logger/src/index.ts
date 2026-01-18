import pino from 'pino';
import pinoPretty from 'pino-pretty';

const isDevelopment = process.env.NODE_ENV !== 'production';

const prettyStream = pinoPretty({
  colorize: isDevelopment,
  translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
  ignore: 'pid,hostname,req,rpc',
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  isDevelopment ? prettyStream : undefined
);

export type Logger = pino.Logger;
