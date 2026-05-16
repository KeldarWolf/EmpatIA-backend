import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

const MODEL = "models/gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

// =====================
// CHAT IA
// =====================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

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

    if (!reply) {
      return res.json({
        reply:
          "🤍 No puedo responder ahora, pero puedo ayudarte con una actividad para sentirte mejor.",
      });
    }

    return res.json({ reply });
  } catch (err) {
    return res.json({
      reply:
        "🤍 La IA no está disponible ahora, pero puedo ayudarte con una actividad para sentirte mejor.",
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

  try {
    const result = await pool.query(
      `INSERT INTO registroactividad
      (id_usuario, id_actividad, nombre_actividad, puntaje_agrado, frecuencia_deseada, reaccion, fecha)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
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
    return res.status(500).json({ error: "Error guardando actividad" });
  }
});

// =====================
// TRAER ACTIVIDADES POR USUARIO (IMPORTANTE)
// =====================
app.get("/api/registro-actividad/usuario/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        ra.*,
        a.instrucciones
      FROM registroactividad ra
      LEFT JOIN actividad a 
      ON ra.id_actividad = a.id_actividad
      WHERE ra.id_usuario = $1
      ORDER BY ra.fecha DESC
      `,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo actividades" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Backend activo en puerto", PORT);
});
