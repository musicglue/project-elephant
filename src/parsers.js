import postgresArray from 'postgres-array';

const arrayParser = parser => val => postgresArray.parse(val, parser);

const defaultParsers = {
  point(val) {
    if (!val) return null;
    const match = val.match(/^\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)$/);
    if (!match) throw new Error(`Invalid point syntax: ${val}`);
    return [match[1], match[2]];
  },
};

export default (db, types, extraParsers) => {
  const parsers = { ...defaultParsers, ...extraParsers };

  return Promise.all(Object.keys(parsers).map(name => {
    const parser = parsers[name];
    return db.one('SELECT oid, typarray FROM pg_type WHERE typname = $1 ORDER BY oid', [name])
      .then(({ oid, typarray }) => {
        types.setTypeParser(oid, parser);
        if (typarray) types.setTypeParser(typarray, arrayParser(parser));
      });
  }));
};
