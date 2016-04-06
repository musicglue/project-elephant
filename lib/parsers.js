"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
const OIDs = {
  point: [600]
};

const parsers = {
  point(val) {
    if (!val) return null;
    const match = val.match(/^\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)$/);
    if (!match) throw new Error(`Invalid point syntax: ${ val }`);
    return [match[1], match[2]];
  }
};

exports.default = types => Object.keys(parsers).forEach(name => {
  if (!OIDs.hasOwnProperty(name)) throw new Error(`No oids listed for ${ name }`);
  OIDs[name].map(oid => types.setTypeParser(oid, parsers[name]));
});