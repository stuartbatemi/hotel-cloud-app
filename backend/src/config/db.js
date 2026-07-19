const { Pool } = require("pg");
const fs = require("fs");

// Aiven (and most managed Postgres hosts) require SSL and give you a CA
// certificate from their console. Pointing DB_SSL_CA_PATH at that file gives
// a properly verified connection instead of just trusting any certificate.
let sslConfig;
if (process.env.DB_SSL === "true") {
  sslConfig = { rejectUnauthorized: true };
  if (process.env.DB_SSL_CA_PATH && fs.existsSync(process.env.DB_SSL_CA_PATH)) {
    sslConfig.ca = fs.readFileSync(process.env.DB_SSL_CA_PATH);
  }
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslConfig,
  max: 10,
});

async function pingDatabase() {
  const { rows } = await pool.query("SELECT 1 AS ok");
  return rows[0].ok === 1;
}

module.exports = { pool, pingDatabase };
