import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pool from "./config/db.js";


dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// 🔎 LOG GLOBAL
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// 🏠 HOME
app.get("/", (req, res) => {
  res.send("EmpatIA Backend activo 🚀");
});

// 🧪 TEST DB
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, db: result.rows[0] });
  } catch (error) {
    console.error("❌ DB ERROR:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 🧑‍💻 REGISTER REAL
app.post("/api/auth/register", async (req, res) => {
  console.log("📩 REGISTER:", req.body);

  try {
    const { nombre, email, password } = req.body;

    // 🔍 validación básica
    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: "Faltan datos"
      });
    }

    console.log("➡️ Verificando usuario...");

    // 🔍 verificar si existe
    const userExists = await pool.query(
      "SELECT * FROM usuario WHERE email = $1",
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        error: "Usuario ya existe"
      });
    }

    console.log("💾 Insertando usuario...");

    // 💾 INSERT
    const result = await pool.query(
      `INSERT INTO usuario (nombre, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id_usuario, nombre, email`,
      [nombre, email, password]
    );

    console.log("✅ Usuario creado:", result.rows[0]);

    return res.json({
      ok: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error("❌ ERROR REAL:");
    console.error(error); // 🔥 esto es lo importante

    return res.status(500).json({
      error: error.message,
      detail: error.detail,
      code: error.code
    });
  }
});

// 🚀 START
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Backend en puerto", PORT);
});
