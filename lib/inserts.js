'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pgPromise = require('pg-promise');

var _pgPromise2 = _interopRequireDefault(_pgPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Inserts {
  constructor(template, rows) {
    this._rawDBType = true;
    this.template = template;
    this.rows = rows;
  }

  formatDBType() {
    return this.rows.map(row => `(${_pgPromise2.default.as.format(this.template, row)})`).join(',');
  }
}
exports.default = Inserts;