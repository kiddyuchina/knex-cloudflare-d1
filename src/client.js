const Client_Sqlite3 = require('knex/lib/dialects/sqlite3/index');

class Client_D1 extends Client_Sqlite3 {
  constructor(config) {
    let filename, wranglerContext = true;
    if (!(config?.connection?.database) || !(config?.connection?.database instanceof Object)) {
      wranglerContext = false;
      filename = require('./local.js').filename(config?.connection?.wranglerPath, config?.connection?.database);
    }

    super({
      ...config,
      connection: {
        filename: filename ?? 'db',
      },
    });

    if (!filename && !config?.connection?.database) {
      this.logger.warn(
        'Could not find `connection.database` in config.'
      );
    }

    this._D1 = config.connection.database;
    this.wranglerContext = wranglerContext;
  }

  _driver () {
    return this.wranglerContext ? this._D1 : super._driver();
  }

  async acquireRawConnection() {
    return this.wranglerContext ? this._D1 : super.acquireRawConnection();
  }

  // Used to explicitly close a connection, called internally by the pool when
  // a connection times out or the pool is shutdown.
  async destroyRawConnection(connection) {
    return true;
  }

  // Runs the query on the specified connection, providing the bindings and any
  // other necessary prep work.
  async _query(connection, obj) {
    if (!obj.sql) throw new Error('The query is empty');
    if (!this.wranglerContext) return super._query(connection, obj);

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

  _stream(connection, obj, stream) {
    if (!obj.sql) throw new Error('The query is empty');
    if (!this.wranglerContext) return _stream(connection, obj, stream);

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