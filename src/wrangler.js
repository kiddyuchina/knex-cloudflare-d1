const { spawnSync } = require('child_process');

function executeQuery(connection, query, bindings = [], options = {}) {
  const { database, local = false } = connection.config.connection;

  const wranglerArgs = [
    'd1',
    'execute',
    database,
  ];

  if (local) {
    wranglerArgs.push('--local');
  }

  // If we have bindings, we need to properly escape and inject them into the query
  let finalQuery = query;
  console.log('bindings:', bindings);
  if (bindings.length > 0) {
    bindings.forEach((binding) => {
      const value = (() => {
        switch (true) {
          case binding === null:
          case binding === undefined:
          case (typeof binding === 'number' && isNaN(binding)):
            return 'NULL';
          case typeof binding === 'boolean':
            return binding ? 1 : 0;
          case typeof binding === 'number':
            return binding;
          case binding instanceof Date:
            return `'${binding.toISOString()}'`;
          case Array.isArray(binding):
            return `'${JSON.stringify(binding)}'`;
          case typeof binding === 'object':
            return `'${JSON.stringify(binding)}'`;
          default:
            // Escape single quotes in strings by doubling them
            return `'${String(binding).replace(/'/g, "''")}'`;
        }
      })();
      
      finalQuery = finalQuery.replace('?', value);
    });
  }

  // Replace backticks with square brackets for SQLite identifiers
  finalQuery = finalQuery.replace(/`(\w+)`/g, '[$1]');
  
  wranglerArgs.push(`--command="${finalQuery}"`);

  wranglerArgs.push('--json');

  const result = spawnSync('wrangler', wranglerArgs, { 
    stdio: 'pipe',
    encoding: 'utf-8'
  });

  if (result.error) {
    throw new Error(`Failed to execute wrangler command: ${result.error.message}`);
  }

  if (result.status !== 0) {
    console.log('result:', result);
    throw new Error(`Command failed with exit code ${result.status}: ${result.stderr}`);
  }

  try {
    // Parse the JSON output from wrangler
    const output = JSON.parse(result.stdout);
    return output;
  } catch (e) {
    // If parsing fails, return the raw output
    return result.stdout;
  }
}

module.exports = {
  executeQuery
};