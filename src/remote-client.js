class RemoteD1Statement {
  constructor(client, sql) {
    this.client = client
    this.sql = sql
    this._bindings = []
  }

  bind(...args) {
    this._bindings = args
    return this
  }

  async all() {
    const res = await this.client.fetch(this.client.endpoint, {
      method: 'POST',
      headers: this.client.headers,
      body: JSON.stringify({
        sql: this.sql,
        params: this._bindings,
      }),
    })
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(`D1 request failed: ${res.status} - ${msg}`)
    }
    const data = await res.json()
    return data.result[0];
  }

  async run() {
    const res = await this.client.fetch(this.client.endpoint, {
      method: 'POST',
      headers: this.client.headers,
      body: JSON.stringify({
        sql: this.sql,
        params: this._bindings,
      }),
    })
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(`D1 request failed: ${res.status} - ${msg}`)
    }
    const data = await res.json()
    return data.result[0];
  }
}

class RemoteClient {
  constructor(options) {
    if (!options.accountId || !options.databaseId || !options.apiToken) {
      throw new Error('Missing required options: accountId, databaseId, apiToken');
    }

    this.endpoint = `https://api.cloudflare.com/client/v4/accounts/${options.accountId}/d1/database/${options.databaseId}/query`;

    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.apiToken}`,
    };

    this.fetch = options.fetch || globalThis.fetch;

    if (!this.fetch) {
      throw new Error('Missing required options: fetch');
    }
  }

  prepare(sql) {
    return new RemoteD1Statement(this, sql)
  }
}

module.exports = RemoteClient;
