import { Pool } from 'pg';

const postgresPool = new Pool({
  host: process.env.MYSQL_DB_HOST,
  port: Number(process.env.MYSQL_DB_PORT),
  user: process.env.MYSQL_DB_USER,
  password: process.env.MYSQL_DB_PASSWORD,
  database: process.env.MYSQL_DB_NAME,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
console.log("PostgreSQL Pool created with config:", {
  host: process.env.MYSQL_DB_HOST,
  port: Number(process.env.MYSQL_DB_PORT),
  user: process.env.MYSQL_DB_USER,
  password: process.env.MYSQL_DB_PASSWORD,
  database: process.env.MYSQL_DB_NAME,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
// Test connection and list databases
postgresPool.connect()
  .then(async (client) => {
    console.log("PostgreSQL connected successfully");
    const result = await client.query(`SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;`);
    console.log("Available databases:", result.rows);
    client.release();
  })
  .catch(err => {
    console.error("PostgreSQL connection failed:", err.message);
  });

export default postgresPool;