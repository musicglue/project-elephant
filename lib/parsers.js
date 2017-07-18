'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _postgresArray = require('postgres-array');

var _postgresArray2 = _interopRequireDefault(_postgresArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const arrayParser = parser => val => _postgresArray2.default.parse(val, parser);

const defaultParsers = {
  point(val) {
    if (!val) return null;
    const match = val.match(/^\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)$/);
    if (!match) throw new Error(`Invalid point syntax: ${val}`);
    return [match[1], match[2]];
  }
};

exports.default = function (db, types) {
  let extraParsers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  const parsers = _extends({}, defaultParsers, extraParsers);

  return Promise.all(Object.keys(parsers).map(name => {
    const parser = parsers[name];
    return db.one('SELECT oid, typarray FROM pg_type WHERE typname = $1 ORDER BY oid', [name]).then((_ref) => {
      let oid = _ref.oid,
          typarray = _ref.typarray;

      types.setTypeParser(oid, parser);
      if (typarray) types.setTypeParser(typarray, arrayParser(parser));
    });
  }));
};