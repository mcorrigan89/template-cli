import { db } from '@template/database';
import { logger } from '@template/logger';
import { Container } from 'inversify';

export const di = new Container({
  autobind: true,
});

export const dbSymbol = Symbol.for('Database');
di.bind(dbSymbol).toConstantValue(db);

export const loggerSymbol = Symbol.for('Logger');
di.bind(loggerSymbol).toConstantValue(logger);
