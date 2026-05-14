import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL NO DEFINIDA");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// 🔥 TEST CONTROLADO
pool.query("SELECT NOW()")
  .then((res) => {
    console.log("✅ DB CONECTADA:", res.rows[0]);
  })
  .catch((err) => {
    console.error("❌ ERROR CONECTANDO DB:");
    console.error("MESSAGE:", err.message);
    console.error("CODE:", err.code);
  });

export default pool;
