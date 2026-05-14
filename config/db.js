import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then((client) => {
    console.log("✅ DB CONECTADA");
    return client.query("SELECT NOW()")
      .then((res) => {
        console.log("🕒 DB TIME:", res.rows[0]);
        client.release();
      })
      .catch((err) => {
        client.release();
        console.error("❌ DB QUERY ERROR:", err.message);
      });
  })
  .catch((err) => {
    console.error("❌ DB CONNECTION ERROR:", err.message);
  });

export default pool;
