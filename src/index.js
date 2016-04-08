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
  db: PG;

  static Inserts = Inserts;
  static setupTypeParsers = setupParsers;

  static deepFormat(format, row, keysToFormat) {
    return keysToFormat.reduce((formatted, key) => {
      if (formatted[key] && typeof formatted[key] === 'object') {
        return {
          ...formatted,
          [key]: Array.isArray(formatted[key])
            ? formatted[key].map(entry => format(entry))
            : format(formatted[key]),
        };
      }
      return formatted;
    }, format(row));
  }

  constructor(db: PG) {
    this.db = db;
  }

  _transaction<R>(fn: TxFn<R>, options: TxOpts = {}) : Promise<R> {
    const mode = new txMode.TransactionMode({
      isolation: txMode.isolationLevel[options.isolation],
      readOnly: options.readOnly,
    });
    const executor = tx => fn(tx);
    executor.txMode = mode;
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

  none(sql: SQL, bindings: Bindings, options: ?QueryOptions) : Promise<void> {
    const db = options && options.tx || this.db;
    return db.none(sql, bindings);
  }

  one(sql: SQL, bindings: Bindings, options: ?QueryOptions) : Promise<T> {
    const db = options && options.tx || this.db;
    return db.one(sql, bindings).then(this.format);
  }

  oneOrNone(sql: SQL, bindings: Bindings, options: ?QueryOptions) : Promise<?T> {
    const db = options && options.tx || this.db;
    return db.oneOrNone(sql, bindings).then(row => row && this.format(row));
  }

  any(sql: SQL, bindings: Bindings, options: ?QueryOptions) : Promise<Array<T>> {
    const db = options && options.tx || this.db;
    return db.any(sql, bindings).then(this.formatRows.bind(this));
  }

  many(sql: SQL, bindings: Bindings, options: ?QueryOptions) : Promise<Array<T>> {
    const db = options && options.tx || this.db;
    return db.many(sql, bindings).then(this.formatRows.bind(this));
  }
}
