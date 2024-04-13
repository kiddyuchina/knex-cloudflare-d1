# knex-cloudflare-d1

[![Version](https://img.shields.io/npm/v/knex-cloudflare-d1.svg)](https://npmjs.com/package/knex-cloudflare-d1)

Cloudflare D1 dialect for Knex.js.

## Install

```
npm i knex-cloudflare-d1
// Or
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
      }
    });

    // ...
  }
}

```

## Author

Kidd Yu <https://github.com/kiddyuchina>

## License

MIT