# knex-cloudflare-d1

[![Version](https://img.shields.io/npm/v/knex-cloudflare-d1.svg)](https://npmjs.com/package/knex-cloudflare-d1)

Cloudflare D1 dialect for Knex.js.

## Install

```bash
npm i knex-cloudflare-d1
// Or
pnpm add knex-cloudflare-d1
```

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
    database: "my_database_name", // From Wrangler Binding
    local: true, // Toggles `--local` flag on `wrangler d1 exec` command (Default as false)
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

## Contributors

- Jeremy H <https://github.com/jjjrmy>

## License

MIT