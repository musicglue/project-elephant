// @flow

import {
  camelCase,
  mapKeys,
} from 'lodash';

import {
  txMode,
} from 'pg-promise';

import type {
  Bindings,
  PG,
  TxFn,
  TxOpts,
  Row,
  QueryOptions,
  SQL,
} from './types';

import Inserts from './inserts';
import setupParsers from './parsers';

export default class Elephant<T> {
  dbs: DBMap;

  static Inserts = Inserts;
  static setupTypeParsers = setupParsers;

  static deepFormat(format, row, keysToFormat) {
    return keysToFormat.reduce((formatted, key) => {
      if (formatted[key] && typeof formatted[key] === 'object') {
        return {
          ...formatted,
          [key]: Array.isArray(formatted[key])
            ? formatted[key].map(entry =>
                Elephant.deepFormat(format, format(entry), keysToFormat))
            : Elephant.deepFormat(format, format(formatted[key]), keysToFormat),
        };
      }
      return formatted;
    }, format(row));
  }

  constructor(dbs: DBMap) {
    this.dbs = dbs;
    Object.assign(this, dbs);
  }

  _transaction<R>(db: PG, fn: TxFn<R>, options: TxOpts = {}) : Promise<R> {
    const mode = new txMode.TransactionMode({
      isolation: txMode.isolationLevel[options.isolation],
      readOnly: options.readOnly,
    });
    const executor = tx => fn(tx);
    executor.txMode = mode;
    return db.tx(executor);
  }

  transaction<R>(db: PG, opts: TxFn<R> | TxOpts, fn?: TxFn<R>) : Promise<R> {
    if (typeof opts === 'function') {
      return this._transaction(db, opts);
    } else if (typeof opts === 'object' && typeof fn === 'function') {
      return this._transaction(db, fn, opts);
    }
    throw new TypeError('transaction must be passed an executor function');
  }

  format(row: Row) : T {
    return mapKeys(row, (value, key) => (key[0] === '_' ? key : camelCase(key)));
  }

  formatRows(rows: Array<Row>) : Array<T> {
    return rows.map(this.format);
  }

  none(db: PG, sql: SQL, bindings: Bindings, options: ?QueryOptions) : Promise<void> {
    const conn = options && options.tx || db;
    return conn.none(sql, bindings);
  }

  one(db: PG, sql: SQL, bindings: Bindings, options: ?QueryOptions) : Promise<T> {
    const conn = options && options.tx || db;
    return conn.one(sql, bindings).then(this.format);
  }

  oneOrNone(db: PG, sql: SQL, bindings: Bindings, options: ?QueryOptions) : Promise<?T> {
    const conn = options && options.tx || db;
    return conn.oneOrNone(sql, bindings).then(row => row && this.format(row));
  }

  any(db: PG, sql: SQL, bindings: Bindings, options: ?QueryOptions) : Promise<Array<T>> {
    const conn = options && options.tx || db;
    return conn.any(sql, bindings).then(this.formatRows.bind(this));
  }

  many(db: PG, sql: SQL, bindings: Bindings, options: ?QueryOptions) : Promise<Array<T>> {
    const conn = options && options.tx || db;
    return conn.many(sql, bindings).then(this.formatRows.bind(this));
  }
}
