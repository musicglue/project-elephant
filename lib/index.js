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
          [key]: Array.isArray(formatted[key]) ? formatted[key].map(entry => format(entry)) : format(formatted[key])
        });
      }
      return formatted;
    }, format(row));
  }

  constructor(db /*: PG*/) {
    this.db = db;
  }

  _transaction /*:: <R>*/(fn /*: TxFn<R>*/) /*: Promise<R>*/ {
    let options /*: TxOpts*/ = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    const mode = new _pgPromise.txMode.TransactionMode({
      isolation: _pgPromise.txMode.isolationLevel[options.isolation],
      readOnly: options.readOnly
    });
    const executor = tx => fn(tx);
    executor.txMode = mode;
    return this.db.tx(executor);
  }

  transaction /*:: <R>*/(opts /*: TxFn<R> | TxOpts*/, fn /*:: ?: TxFn<R>*/) /*: Promise<R>*/ {
    if (typeof opts === 'function') {
      return this._transaction(opts);
    } else if (typeof opts === 'object' && typeof fn === 'function') {
      return this._transaction(fn);
    }
    throw new TypeError('transaction must be passed an executor function');
  }

  format(row /*: Row*/) /*: T*/ {
    return (0, _lodash.mapKeys)(row, (value, key) => (0, _lodash.camelCase)(key));
  }

  formatRows(rows /*: Array<Row>*/) /*: Array<T>*/ {
    return rows.map(this.format);
  }

  none(sql /*: SQL*/, bindings /*: Bindings*/, options /*: ?QueryOptions*/) /*: Promise<void>*/ {
    const db = options && options.tx || this.db;
    return db.none(sql, bindings);
  }

  one(sql /*: SQL*/, bindings /*: Bindings*/, options /*: ?QueryOptions*/) /*: Promise<T>*/ {
    const db = options && options.tx || this.db;
    return db.one(sql, bindings).then(this.format);
  }

  oneOrNone(sql /*: SQL*/, bindings /*: Bindings*/, options /*: ?QueryOptions*/) /*: Promise<?T>*/ {
    const db = options && options.tx || this.db;
    return db.oneOrNone(sql, bindings).then(row => row && this.format(row));
  }

  any(sql /*: SQL*/, bindings /*: Bindings*/, options /*: ?QueryOptions*/) /*: Promise<Array<T>>*/ {
    const db = options && options.tx || this.db;
    return db.any(sql, bindings).then(this.formatRows.bind(this));
  }

  many(sql /*: SQL*/, bindings /*: Bindings*/, options /*: ?QueryOptions*/) /*: Promise<Array<T>>*/ {
    const db = options && options.tx || this.db;
    return db.many(sql, bindings).then(this.formatRows.bind(this));
  }
}
exports.default = Elephant;
Elephant.Inserts = _inserts2.default;
Elephant.setupTypeParsers = _parsers2.default;