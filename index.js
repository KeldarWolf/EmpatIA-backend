import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

// =====================
// CONFIG
// =====================
app.use(cors({ origin: "*" }));
app.use(express.json());

// =====================
// LOGS
// =====================
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// =====================
// ROUTES
// =====================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// =====================
// HOME
// =====================
app.get("/", (req, res) => {
  res.send("🚀 EmpatIA Backend activo");
});

// =====================
// GEMINI CONFIG
// =====================
const MODEL = "models/gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

// =====================
// CHAT IA
// =====================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  console.log("📩 MESSAGE:", message);

  if (!message?.trim()) {
    return res.json({
      reply: "🤍 Cuéntame cómo te sientes.",
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
        }),
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!response.ok || !reply) {
      return res.json({
        reply:
          "🤍 No puedo responder ahora, pero puedo ayudarte con una actividad para sentirte mejor.",
      });
    }

    return res.json({ reply });
  } catch (err) {
    console.log("❌ ERROR IA:", err.message);

    return res.json({
      reply:
        "🤍 La IA no está disponible ahora, pero puedo ayudarte con una actividad.",
    });
  }
});

// =====================
// GUARDAR ACTIVIDAD
// =====================
app.post("/api/registro-actividad", async (req, res) => {
  const {
    id_usuario,
    id_actividad,
    nombre_actividad,
    puntaje_agrado,
    frecuencia_deseada,
    reaccion,
  } = req.body;

  console.log("📥 ACTIVIDAD RECIBIDA:", req.body);

  try {
    const result = await pool.query(
      `INSERT INTO registroactividad
       (id_usuario, id_actividad, nombre_actividad, puntaje_agrado, frecuencia_deseada, reaccion, fecha)
       VALUES ($1,$2,$3,$4,$5,$6, NOW())
       RETURNING *`,
      [
        id_usuario,
        id_actividad || null,
        nombre_actividad,
        puntaje_agrado,
        frecuencia_deseada,
        reaccion,
      ]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.log("❌ ERROR BD:", err.message);

    return res.status(500).json({
      error: "Error guardando actividad",
    });
  }
});

// =====================
// 🔥 NUEVO: ACTIVIDADES POR USUARIO (TE FALTABA ESTO)
// =====================
app.get("/api/registro-actividad/usuario/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * 
       FROM registroactividad 
       WHERE id_usuario = $1
       ORDER BY fecha DESC`,
      [id]
    );

    return res.json(result.rows);
  } catch (err) {
    console.log("❌ ERROR GET ACTIVIDADES:", err.message);

    return res.status(500).json({
      error: "Error obteniendo actividades",
    });
  }
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Backend en puerto ${PORT}`);
});
