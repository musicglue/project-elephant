/* @flow */

import type { QueryOptions } from './types';

const defaultFormatter = (row: any): any => row

type PgTx = {};
type TxFn<R> = (tx: PgTx) => Promise<R>;
type TxOpts = { isolation?: string };

export default class Elephant<T> {
  db: any;

  constructor(db: any) {
    this.db = db;
  }

  _transaction<R>(fn: TxFn<R>, options: TxOpts = {}) : Promise<R> {
    const mode = new TransactionMode({});
    fn.mode = mode;
    return this.db.transaction(fn);
  }

  transaction<R>(opts: TxFn<R> | TxOpts, fn?: TxFn<R>) : Promise<R> {
    if (typeof opts === 'function') {
      return this._transaction(opts);
    } else if (typeof opts === 'object' && typeof fn === 'function') {
      return this._transaction(fn);
    } else {
      throw new Error('errrhhmahhgerrrddddd it went wrong');
    }
  }

  format(row: Object) : T {
    const record: T = defaultFormatter(row);
    return record;
  }

  formatRows(rows: Array<Object>) : Array<T> {
    return rows.map(this.format);
  }

  one(sql: string, bindings: Array<any>, options: ?QueryOptions) : Promise<T> {
    const db = options && options.tx || this.db;
    return db.oneOrNone(sql, bindings).then(this.format);
  }

  many(sql: string, bindings: Array<any>, options: ?QueryOptions) : Promise<Array<T>> {
    const db = options && options.tx || this.db;
    return db.manyOrNone(sql, bindings).then(this.formatRows);
  }
}
