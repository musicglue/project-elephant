import pg from 'pg-promise';

export default class Inserts {
  constructor(template, rows) {
    this._rawDBType = true;
    this.template = template;
    this.rows = rows;
  }

  formatDBType() {
    return this.rows.map(row => `(${pg.as.format(this.template, row)})`).join(',');
  }
}
