#!/usr/bin/env node

/**
 * CLI script for "knex-cloudflare-d1 setup"
 * 
 * When the user types:
 *   knex-cloudflare-d1 setup --persist-to ../.wrangler/state
 * This script will:
 *   1. Parse wrangler.toml
 *   2. For each `d1_databases` entry, retrieve `database_name`
 *   3. Run:
 *       wrangler d1 execute {database_name} --local --command='SELECT 1 limit 0;' [extra args...]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const toml = require('toml'); // You need "toml" in your dependencies.

/**
 * Reads wrangler.toml from current working directory (or adjust path as needed).
 */
function loadWranglerConfig() {
  const wranglerTomlPath = path.resolve(process.cwd(), 'wrangler.toml');
  if (!fs.existsSync(wranglerTomlPath)) {
    throw new Error(`wrangler.toml not found at: ${wranglerTomlPath}`);
  }
  const tomlContents = fs.readFileSync(wranglerTomlPath, 'utf8');
  return toml.parse(tomlContents);
}

function main() {
  // `process.argv` might look like:
  // ["/usr/local/bin/node", "/path/to/cli.js", "setup", "--persist-to", "../.wrangler/state"]
  // We only care about what's after "setup".
  const rawArgs = process.argv.slice(2);
  
  // If you specifically only want the command to respond to "setup":
  if (rawArgs[0] !== 'setup') {
    console.error(`Unknown command: ${rawArgs[0]}. Did you mean "setup"?`);
    process.exit(1);
  }

  // The rest of the arguments (anything after "setup") we forward to wrangler
  const extraWranglerArgs = rawArgs.slice(1);

  // 1) Load wrangler.toml
  let wranglerConfig;
  try {
    wranglerConfig = loadWranglerConfig();
  } catch (err) {
    console.error('Failed to load wrangler.toml:', err.message);
    process.exit(1);
  }

  // 2) Get the array of D1 databases
  const databases = wranglerConfig.d1_databases || [];
  if (!Array.isArray(databases) || databases.length === 0) {
    console.error('No d1_databases found in wrangler.toml.');
    process.exit(1);
  }

  // 3) For each database, run "wrangler d1 execute ..."
  for (const db of databases) {
    const databaseName = db.database_name;
    if (!databaseName) {
      console.warn('Skipping a d1_databases entry with no "database_name":', db);
      continue;
    }

    // Construct the wrangler arguments
    // e.g. wrangler d1 execute DB_NAME --local --command='SELECT 1 limit 0;'
    const wranglerArgs = [
      'd1',
      'execute',
      databaseName,
      '--local',
      `--command=SELECT 1 limit 0;`
    ];

    // Append any extra flags from the user
    wranglerArgs.push(...extraWranglerArgs);

    console.log(`\nRunning: wrangler ${wranglerArgs.join(' ')}`);

    const result = spawnSync('wrangler', wranglerArgs, { stdio: 'inherit' });
    if (result.error) {
      console.error('Error running wrangler command:', result.error);
      process.exit(result.status || 1);
    }
    if (result.status !== 0) {
      console.error(`wrangler command failed with exit code: ${result.status}`);
      process.exit(result.status);
    }
  }

  console.log('\nAll d1 databases have been "setup" successfully.');
}

main();