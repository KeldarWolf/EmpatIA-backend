import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

const MODEL = "models/gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

/* =========================
   CHAT IA (solo fallback)
========================= */
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
          "🤍 No puedo responder ahora, pero puedo ayudarte con una actividad.",
      });
    }

    return res.json({ reply });
  } catch (err) {
    return res.json({
      reply:
        "🤍 La IA no está disponible. Puedo sugerirte una actividad.",
    });
  }
});

/* =========================
   GUARDAR ACTIVIDAD
========================= */
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

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "error registro actividad" });
  }
});

/* =========================
   OBTENER ACTIVIDADES POR USUARIO (TE FALTABA)
========================= */
app.get("/api/registro-actividad/usuario/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM registroactividad
       WHERE id_usuario = $1
       ORDER BY id_registro DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "error load actividades" });
  }
});

/* =========================
   RUTINA
========================= */

/* crear rutina */
app.post("/api/rutina", async (req, res) => {
  const { id_usuario, nombre, descripcion, frecuencia } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO rutinapersonalizada
      (id_usuario, nombre, descripcion, frecuencia, fecha_creacion)
      VALUES ($1,$2,$3,$4,NOW())
      RETURNING *`,
      [id_usuario, nombre, descripcion, frecuencia]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "error rutina" });
  }
});

/* agregar días a rutina */
app.post("/api/rutina/dias", async (req, res) => {
  const { id_rutina, dias } = req.body; 
  // dias: [{dia:0,hora:"08:00",descripcion:"..."}, ...]

  try {
    const inserts = await Promise.all(
      dias.map(d =>
        pool.query(
          `INSERT INTO rutinadias
          (id_rutina, dia, hora, descripcion)
          VALUES ($1,$2,$3,$4)`,
          [id_rutina, d.dia, d.hora, d.descripcion]
        )
      )
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "error rutina dias" });
  }
});

/* obtener rutina usuario */
app.get("/api/rutina/:id_usuario", async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const result = await pool.query(
      `SELECT * FROM rutinapersonalizada
       WHERE id_usuario = $1`,
      [id_usuario]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "error get rutina" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Backend listo en", PORT);
});
