const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  console.error(
    "ERROR: DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string."
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
});

module.exports = pool;
