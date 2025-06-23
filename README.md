# knex-cloudflare-d1

[![Version](https://img.shields.io/npm/v/knex-cloudflare-d1.svg)](https://npmjs.com/package/knex-cloudflare-d1)

Cloudflare D1 dialect for Knex.js.

## Install

```
npm i knex-cloudflare-d1
// OR
pnpm add knex-cloudflare-d1
```

## Usage

```js
import Knex from 'knex';
import ClientD1 from 'knex-cloudflare-d1';

export interface Env {
  DB: D1Database;
}

export default {
  fetch: (req: Request, env: Env) => {
    // ...

    const knex = Knex({
      client: ClientD1,
      connection: {
        database: env.DB
      },
      useNullAsDefault: true,
    });

    // ...
  }
}
```

### Remote Client

You can use the remote client to connect to a D1 database outside of Cloudflare Workers.

```js
import Knex from 'knex';
import ClientD1 from 'knex-cloudflare-d1';
import RemoteClient from 'knex-cloudflare-d1/remote-client';

const DB = new RemoteClient({
  accountId: 'your-account-id',
  databaseId: 'your-database-id',
  apiToken: 'your-api-token',
  fetch: fetch, // Optional, default to globalThis.fetch
});

const knex = Knex({
  client: RemoteClient,
  connection: {
    database: DB
  },
  useNullAsDefault: true,
});
```

## Author

Kidd Yu <https://github.com/kiddyuchina>

## License

MIT