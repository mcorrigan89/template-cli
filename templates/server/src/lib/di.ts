import { createDatabase } from '@template/database';
import { getServerEnv } from '@template/env/server';
import { logger } from '@template/logger';
import { Container } from 'inversify';

export const di = new Container({
  autobind: true,
});

export const dbSymbol = Symbol.for('Database');
di.bind(dbSymbol).toDynamicValue(() => {
  const env = getServerEnv();
  return createDatabase(env.DATABASE_URL);
});

export const loggerSymbol = Symbol.for('Logger');
di.bind(loggerSymbol).toConstantValue(logger);
