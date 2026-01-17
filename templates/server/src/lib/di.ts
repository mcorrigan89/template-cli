import { db } from '@template/database';
import { Container } from 'inversify';

export const di = new Container({
  autobind: true,
});

export const dbSymbol = Symbol.for('Database');
di.bind(dbSymbol).toConstantValue(db);
