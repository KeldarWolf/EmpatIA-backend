import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// 🔥 TEST REAL DE CONEXIÓN
pool.query("SELECT NOW()")
  .then((res) => {
    console.log("✅ DB CONECTADA:", res.rows[0]);
  })
  .catch((err) => {
    console.error("❌ ERROR CONECTANDO DB:");
    console.error(err.message);
  });

export default pool;
