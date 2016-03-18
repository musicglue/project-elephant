// @flow

import {
  camelCase,
  mapKeys,
} from 'lodash';

import pgp, {
  txMode,
} from 'pg-promise';

import type {
  Bindings,
  PG,
  TxFn,
  TxOpts,
  Row,
  QueryOptions,
  QueryFile,
} from './types';

export default class Elephant<T> {
  db: PG;

  static queryFile(file: string): QueryFile {
    return new pgp.QueryFile(file, { minify: true, debug: true });
  }

  constructor(db: PG) {
    this.db = db;
  }

  _transaction<R>(fn: TxFn<R>, options: TxOpts = {}) : Promise<R> {
    const mode = new txMode.TransactionMode({
      isolation: txMode.isolationLevel[options.isolation],
    });
    const executor = tx => fn(tx);
    executor.mode = mode;
    return this.db.tx(executor);
  }

  transaction<R>(opts: TxFn<R> | TxOpts, fn?: TxFn<R>) : Promise<R> {
    if (typeof opts === 'function') {
      return this._transaction(opts);
    } else if (typeof opts === 'object' && typeof fn === 'function') {
      return this._transaction(fn);
    }
    throw new TypeError('transaction must be passed an executor function');
  }

  format(row: Row) : T {
    return mapKeys(row, (value, key) => camelCase(key));
  }

  formatRows(rows: Array<Row>) : Array<T> {
    return rows.map(this.format);
  }

  one(sql: string, bindings: Bindings, options: ?QueryOptions) : Promise<T> {
    const db = options && options.tx || this.db;
    return db.one(sql, bindings).then(this.format);
  }

  many(sql: string, bindings: Bindings, options: ?QueryOptions) : Promise<Array<T>> {
    const db = options && options.tx || this.db;
    return db.many(sql, bindings).then(this.formatRows);
  }
}
