const fs = require('fs');
const toml = require('toml');
const crypto = require('crypto');
const path = require('path');

const objectName = "miniflare-D1DatabaseObject";

const databaseId = (databaseName = undefined) => {
  const tomlString = fs.readFileSync('./wrangler.toml', 'utf8');
  const config = toml.parse(tomlString);
  if (!config.d1_databases.length) throw new Error("No D1 databases found");
  const database = databaseName 
    ? config.d1_databases.find(db => db.database_name === databaseName)
    : config.d1_databases[0];
  if (!database) throw new Error(`D1 database '${databaseName}' not found`);
  return database.database_id;
}

// https://github.com/cloudflare/workers-sdk/blob/main/packages/miniflare/src/plugins/shared/index.ts#L195
function durableObjectNamespaceIdFromName(uniqueKey, name) {
	const key = crypto.createHash("sha256").update(uniqueKey).digest();
	const nameHmac = crypto
		.createHmac("sha256", key)
		.update(name)
		.digest()
		.subarray(0, 16);
	const hmac = crypto
		.createHmac("sha256", key)
		.update(nameHmac)
		.digest()
		.subarray(0, 16);
	return Buffer.concat([nameHmac, hmac]).toString("hex");
}

const filename = (filepath = ".", databaseName = undefined) => {
    const file = `${durableObjectNamespaceIdFromName(objectName, databaseId(databaseName))}.sqlite`;
    const folder = path.join(filepath, `.wrangler/state/v3/d1/${objectName}`);
    if (!fs.existsSync(folder)) throw new Error(`D1 directory not found: ${folder}`);
    const files = fs.readdirSync(folder);
    if (!files.length) throw new Error(`No D1 database files found: ${file}`);
    const filePath = path.join(folder, file);
    if (!fs.existsSync(filePath)) throw new Error(`D1 database file ${file} not found in ${folder}`);
    return filePath;
}

module.exports = { filename };