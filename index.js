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

// =====================
// LOGS
// =====================
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// =====================
// ROUTES BASE
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
// IA CHAT
// =====================
const MODEL = "models/gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message?.trim()) {
    return res.json({ reply: "🤍 Cuéntame cómo te sientes." });
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

    if (!reply) {
      return res.json({
        reply:
          "🤍 No pude responder ahora, pero puedo ayudarte con una actividad.",
      });
    }

    return res.json({ reply });
  } catch (err) {
    console.log("IA ERROR:", err.message);
    return res.json({
      reply:
        "🤍 La IA no está disponible, pero puedo ayudarte con una actividad.",
    });
  }
});

// =====================
// ACTIVIDADES REGISTRO
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

    res.json(result.rows[0]);
  } catch (err) {
    console.log("ERROR ACTIVIDAD:", err.message);
    res.status(500).json({ error: "Error guardando actividad" });
  }
});

// =====================
// RUTINA (PLANTILLA)
// =====================

// crear rutina
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
    console.log("ERROR RUTINA:", err.message);
    res.status(500).json({ error: "Error creando rutina" });
  }
});

// obtener rutinas usuario
app.get("/api/rutina/:id_usuario", async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM rutinapersonalizada
       WHERE id_usuario = $1
       ORDER BY id_rutina DESC`,
      [id_usuario]
    );

    res.json(result.rows);
  } catch (err) {
    console.log("ERROR GET RUTINA:", err.message);
    res.status(500).json([]);
  }
});

// eliminar rutina
app.delete("/api/rutina/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      "DELETE FROM rutinapersonalizada WHERE id_rutina = $1",
      [id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.log("ERROR DELETE RUTINA:", err.message);
    res.status(500).json({ error: "Error eliminando" });
  }
});

// =====================
// RUTINA DIAS (CALENDARIO REAL)
// =====================

// obtener días de rutina usuario
app.get("/api/rutina-dias/:id_usuario", async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM rutina_dias
       WHERE id_usuario = $1
       ORDER BY fecha ASC`,
      [id_usuario]
    );

    res.json(result.rows);
  } catch (err) {
    console.log("ERROR DIAS:", err.message);
    res.status(500).json([]);
  }
});

// marcar día completado
app.patch("/api/rutina-dias/:id", async (req, res) => {
  const { id } = req.params;
  const { completado } = req.body;

  try {
    const result = await pool.query(
      `UPDATE rutina_dias
       SET completado = $1
       WHERE id_rutina_dia = $2
       RETURNING *`,
      [completado, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log("ERROR PATCH DIA:", err.message);
    res.status(500).json({ error: "Error actualizando" });
  }
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Backend en puerto ${PORT}`);
});
