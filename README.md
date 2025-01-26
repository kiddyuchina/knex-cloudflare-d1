# knex-cloudflare-d1

[![Version](https://img.shields.io/npm/v/knex-cloudflare-d1.svg)](https://npmjs.com/package/knex-cloudflare-d1)

Cloudflare D1 dialect for Knex.js.

## Install

```bash
npm i knex-cloudflare-d1
// Or
pnpm add knex-cloudflare-d1
```

> [!IMPORTANT]  
> When you start a new Wrangler project, the D1 databases don't exist locally until you run a query against them. To create the local databases, run the following command:
> ```bash
> npx knex-cloudflare-d1 setup
> ```

## Usage
**wrangler.toml**
```toml
# ...

[[d1_databases]]
binding = "DB"
database_name = "my_database_name"
database_id = "..."

# ...
```

**knex.config.ts**
```js
import ClientD1 from 'knex-cloudflare-d1';

export default const knexConfig = {
  client: ClientD1,
  connection: {
    database: "my_database_name", // From Wrangler Binding, Defaults to first D1 Database in Wrangler.
    wranglerPath: ".", // Default as "."
  },
  useNullAsDefault: true,
};
```

**index.ts**
```js
import Knex from 'knex';
import knexConfig from './knex.config';

export interface Env {
  DB: D1Database;
}

export default {
  fetch: (req: Request, env: Env) => {
    // ...

    const knex = Knex({
      ... knexConfig,
      connection: {
        database: env.DB
      },
    });

    // ...
  }
}

```

## Author

Kidd Yu <https://github.com/kiddyuchina>

## License

MIT