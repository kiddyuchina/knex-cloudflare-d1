const Client_Sqlite3 = require('knex/lib/dialects/sqlite3/index');

class Client_D1 extends Client_Sqlite3 {
  constructor(config) {
    super({
      ...config,
      connection: {
        ... config.connection,
        filename: ":memory:",
      },
    });

    if (!config?.connection?.database) {
      this.logger.warn(
        'Could not find `connection.database` in config.'
      );
    }

    this.workerContext = config?.connection?.database instanceof Object;
  }

  _driver() {
    return this.config.connection.database;
  }

  async acquireRawConnection() {
    return Promise.resolve(this);
  }

  // Used to explicitly close a connection, called internally by the pool when
  // a connection times out or the pool is shutdown.
  async destroyRawConnection(connection) {
    return true;
  }

  // Runs the query on the specified connection, providing the bindings and any
  // other necessary prep work.
  async _queryD1(connection, obj) {
    const { method } = obj;
    let callMethod;
    switch (method) {
      case 'insert':
      case 'update':
        callMethod = obj.returning ? 'all' : 'run';
        break;
      case 'counter':
      case 'del':
        callMethod = 'run';
        break;
      default:
        callMethod = 'all';
    }

    if (!connection) {
      new Error(`Error calling ${callMethod} on connection.`);
    }

    const { results } = await connection.prepare(obj.sql).bind(...obj.bindings)?.[callMethod]();

    obj.response = results;
    obj.context = this;
    return obj;
  }

  async _queryWrangler(connection, obj) {
    const { executeQuery } = require("./wrangler");

    if (["BEGIN", "COMMIT", "ROLLBACK"].includes(obj.sql.replace(/;$/, ''))) {
      console.warn(
        "[WARN] D1 doesn't support transactions, see https://blog.cloudflare.com/whats-new-with-d1/"
      );
      return Promise.resolve();
    }

    const result = await executeQuery(connection, obj.sql, obj.bindings);

    obj.response = result[0].results;
    obj.context = this;
    return obj;
  }

  async _query(connection, obj) {
    if (!obj.sql) throw new Error("The query is empty");
    return this.workerContext
      ? this._queryD1(connection, obj)
      : this._queryWrangler(connection, obj);
  }

  _stream(connection, obj, stream) {
    if (!obj.sql) throw new Error('The query is empty');
    if (!this.workerContext) return super._stream(connection, obj, stream);

    const client = this;
    stream.on('error', (error) => {
      throw error
    });
    stream.on('end', () => {
      stream.emit('finish');
    });

    return client
      ._query(connection, obj)
      .then((obj) => obj.response)
      .then((rows) => rows.forEach((row) => stream.write(row)))
      .catch(function (err) {
        stream.emit('error', err);
      })
      .then(function () {
        stream.end();
      });
  }
};

Object.assign(Client_D1.prototype, {
  dialect: 'sqlite3',
  driverName: 'knex-cloudflare-d1',
});

module.exports = Client_D1;