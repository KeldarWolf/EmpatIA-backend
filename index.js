import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pool from "./config/db.js";

dotenv.config();

const app = express();

// 🔓 CORS
app.use(cors({ origin: "*" }));

// 📦 JSON
app.use(express.json());

// 🔎 LOG GLOBAL
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// 🏠 HOME
app.get("/", (req, res) => {
  res.send(`
    <h2>EmpatIA Backend activo 🤖</h2>
    <p>Endpoints:</p>
    <ul>
      <li>POST /chat</li>
      <li>POST /api/auth/register</li>
      <li>GET /health</li>
      <li>GET /test-db</li>
    </ul>
  `);
});

// 🧪 HEALTH
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// 🧪 TEST DB (CLAVE PARA VER SI CONECTA)
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      ok: true,
      db: result.rows[0],
    });
  } catch (error) {
    console.error("❌ DB ERROR:", error.message);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

// 🤖 CHAT IA
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Eres EmpatIA, asistente emocional. Responde corto.\nUsuario: ${message}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await r.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.error?.message ||
      "Te leo 🤍";

    res.json({ reply });

  } catch (error) {
    console.error("CHAT ERROR:", error);
    res.status(500).json({ reply: "Error en IA 😢" });
  }
});

// 🧑‍💻 REGISTER REAL CON BD
app.post("/api/auth/register", async (req, res) => {

  console.log("📩 REGISTER:", req.body);

  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: "Faltan datos"
      });
    }

    // 🔍 ver si existe
    const check = await pool.query(
      "SELECT * FROM usuario WHERE email = $1",
      [email]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({
        error: "Usuario ya existe"
      });
    }

    console.log("💾 Insertando usuario...");

    const result = await pool.query(
      `INSERT INTO usuario (nombre, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id_usuario, nombre, email`,
      [nombre, email, password]
    );

    console.log("✅ Usuario creado:", result.rows[0]);

    res.json({
      ok: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error("❌ REGISTER ERROR:");
    console.error(error.message);

    res.status(500).json({
      error: error.message
    });
  }
});

// 🚀 START
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Backend en puerto", PORT);
});
