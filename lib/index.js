'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _pgPromise = require('pg-promise');

var _pgPromise2 = _interopRequireDefault(_pgPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// @flow

/*:: import type {
  Bindings,
  PG,
  TxFn,
  TxOpts,
  Row,
  QueryOptions,
  QueryFile,
} from './types';*/
class Elephant /*:: <T>*/ {
  /*:: db: PG;*/


  static queryFile(file /*: string*/) /*: QueryFile*/ {
    return new _pgPromise2.default.QueryFile(file, { minify: true, debug: true });
  }

  constructor(db /*: PG*/) {
    this.db = db;
  }

  _transaction /*:: <R>*/(fn /*: TxFn<R>*/) /*: Promise<R>*/ {
    let options /*: TxOpts*/ = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    const mode = new _pgPromise.txMode.TransactionMode({
      isolation: _pgPromise.txMode.isolationLevel[options.isolation]
    });
    const executor = tx => fn(tx);
    executor.mode = mode;
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

  one(sql /*: string*/, bindings /*: Bindings*/, options /*: ?QueryOptions*/) /*: Promise<T>*/ {
    const db = options && options.tx || this.db;
    return db.one(sql, bindings).then(this.format);
  }

  many(sql /*: string*/, bindings /*: Bindings*/, options /*: ?QueryOptions*/) /*: Promise<Array<T>>*/ {
    const db = options && options.tx || this.db;
    return db.many(sql, bindings).then(this.formatRows);
  }
}
exports.default = Elephant;