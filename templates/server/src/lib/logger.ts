import pino from 'pino'
import pinoPretty from 'pino-pretty'
import { diContainer } from './di.ts'

const isDevelopment = process.env.NODE_ENV !== 'production'

const prettyStream = pinoPretty({
  colorize: isDevelopment,
  translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
  ignore: 'pid,hostname',
})

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  isDevelopment ? prettyStream : undefined,
)

export const loggerSymbol = Symbol.for('Logger')
export type Logger = pino.Logger
diContainer.bind<Logger>(loggerSymbol).toConstantValue(logger)
