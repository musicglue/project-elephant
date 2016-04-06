// @flow

export type Row = Object;
export type Bindings = Object | Array<any>;

export type QueryFile = {
  error: ?Error;
  file: string;
  options: Object;
  query: string;
};

export type SQL = QueryFile | string;

export type TxFn<R> = (tx: PG) => Promise<R>;

export type PG = {
  many: (query: SQL, values: Bindings) => Promise<Array<Row>>;
  one: (query: SQL, values: Bindings) => Promise<Row>;
  none: (query: SQL, values: Bindings) => Promise<void>;
  any: (query: SQL, values: Bindings) => Promise<Array<Row>>;
  oneOrNone: (query: SQL, values: Bindings) => Promise<?Row>;
  manyOrNone: (query: SQL, values: Bindings) => Promise<Array<Row>>;
  tx: (executor: TxFn) => Promise;
}

export type TxOpts = {
  isolation?: 'serializable' | 'read-only' | 'deferrable';
  readOnly?: bool;
};

export type QueryOptions = {
  tx?: PG,
};
