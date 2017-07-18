'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; // @flow

var _lodash = require('lodash');

var _pgPromise = require('pg-promise');

var _inserts = require('./inserts');

var _inserts2 = _interopRequireDefault(_inserts);

var _parsers = require('./parsers');

var _parsers2 = _interopRequireDefault(_parsers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*:: import type {
  Bindings,
  PG,
  TxFn,
  TxOpts,
  Row,
  QueryOptions,
  SQL,
} from './types';*/
class Elephant /*:: <T>*/ {

  static deepFormat(format, row, keysToFormat) {
    return keysToFormat.reduce((formatted, key) => {
      if (formatted[key] && typeof formatted[key] === 'object') {
        return _extends({}, formatted, {
          [key]: Array.isArray(formatted[key]) ? formatted[key].map(entry => Elephant.deepFormat(format, format(entry), keysToFormat)) : Elephant.deepFormat(format, format(formatted[key]), keysToFormat)
        });
      }
      return formatted;
    }, format(row));
  }

  constructor(dbs /*: DBMap*/) {
    this.dbs = dbs;
    Object.assign(this, dbs);
  }

  _transaction /*:: <R>*/(db /*: PG*/, fn /*: TxFn<R>*/) /*: Promise<R>*/ {
    let options /*: TxOpts*/ = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    const mode = new _pgPromise.txMode.TransactionMode({
      isolation: _pgPromise.txMode.isolationLevel[options.isolation],
      readOnly: options.readOnly
    });
    const executor = tx => fn(tx);
    executor.txMode = mode;
    return db.tx(executor);
  }

  transaction /*:: <R>*/(db /*: PG*/, opts /*: TxFn<R> | TxOpts*/, fn /*:: ?: TxFn<R>*/) /*: Promise<R>*/ {
    if (typeof opts === 'function') {
      return this._transaction(db, opts);
    } else if (typeof opts === 'object' && typeof fn === 'function') {
      return this._transaction(db, fn, opts);
    }
    throw new TypeError('transaction must be passed an executor function');
  }

  format(row /*: Row*/) /*: T*/ {
    return (0, _lodash.mapKeys)(row, (value, key) => key[0] === '_' ? key : (0, _lodash.camelCase)(key));
  }

  formatRows(rows /*: Array<Row>*/) /*: Array<T>*/ {
    return rows.map(this.format);
  }

  none(db /*: PG*/, sql /*: SQL*/, bindings /*: Bindings*/, options /*: ?QueryOptions*/) /*: Promise<void>*/ {
    const conn = options && options.tx || db;
    return conn.none(sql, bindings);
  }

  one(db /*: PG*/, sql /*: SQL*/, bindings /*: Bindings*/, options /*: ?QueryOptions*/) /*: Promise<T>*/ {
    const conn = options && options.tx || db;
    return conn.one(sql, bindings).then(this.format);
  }

  oneOrNone(db /*: PG*/, sql /*: SQL*/, bindings /*: Bindings*/, options /*: ?QueryOptions*/) /*: Promise<?T>*/ {
    const conn = options && options.tx || db;
    return conn.oneOrNone(sql, bindings).then(row => row && this.format(row));
  }

  any(db /*: PG*/, sql /*: SQL*/, bindings /*: Bindings*/, options /*: ?QueryOptions*/) /*: Promise<Array<T>>*/ {
    const conn = options && options.tx || db;
    return conn.any(sql, bindings).then(this.formatRows.bind(this));
  }

  many(db /*: PG*/, sql /*: SQL*/, bindings /*: Bindings*/, options /*: ?QueryOptions*/) /*: Promise<Array<T>>*/ {
    const conn = options && options.tx || db;
    return conn.many(sql, bindings).then(this.formatRows.bind(this));
  }
}
exports.default = Elephant;
Elephant.Inserts = _inserts2.default;
Elephant.setupTypeParsers = _parsers2.default;