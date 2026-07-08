const pg = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

async function main() {
  console.log("DB_URL:", process.env.DATABASE_URL);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  console.log("CONNECTED via pg");
  const res = await client.query("SELECT NOW() as t, current_database() as db");
  console.log("RESULT:", JSON.stringify(res.rows, null, 2));
  client.release();
  await pool.end();
  console.log("DONE");
}

main().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
