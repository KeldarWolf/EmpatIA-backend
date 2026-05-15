// =========================
// INDEX.JS COMPLETO MOD
// =========================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

import pool from "./config/db.js";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// =========================
// LOG
// =========================
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// =========================
// TEST DB
// =========================
pool.query("SELECT NOW()")
  .then((r) => {
    console.log("✅ DB CONECTADA:", r.rows[0]);
  })
  .catch((err) => {
    console.log("❌ DB ERROR:", err.message);
  });

// =========================
// ROUTES
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// =========================
// HEALTH
// =========================
app.get("/", (req, res) => {
  res.send("🚀 EmpatIA Backend activo 🤍");
});

// =========================
// CONFIG IA
// =========================
const MODEL = "models/gemini-2.5-flash";

const API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
Eres EmpatIA.
Respondes corto, empático y humano.
No eres técnico.
Si no puedes ayudar, sugieres actividades suaves.
`;

// =========================
// GEMINI
// =========================
async function callGemini(message) {
  try {

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\nUsuario: ${message}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await r.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      ok: r.ok,
      reply,
    };

  } catch (err) {

    return {
      ok: false,
      reply: null,
      error: err.message,
    };
  }
}

// =========================
// CHAT
// =========================
app.post("/chat", async (req, res) => {

  const { message } = req.body;

  console.log("🔥 CHAT:", message);

  if (!message?.trim()) {
    return res.json({
      reply: "🤍 Cuéntame cómo te sientes.",
      errorType: "EMPTY",
    });
  }

  const result = await callGemini(message);

  if (!result.ok || !result.reply) {

    return res.json({
      reply:
        "🤍 Ahora mismo no puedo responder… ¿quieres hacer una actividad?",
      errorType: "IA_FAIL",
    });
  }

  return res.json({
    reply: result.reply,
    model: MODEL,
  });
});

// =========================
// REGISTRAR ACTIVIDAD
// =========================
app.post("/registro-actividad", async (req, res) => {

  try {

    const {
      id_usuario,
      nombre_actividad,
      puntaje_agrado,
      frecuencia_deseada,
      reaccion,
    } = req.body;

    console.log("📩 BODY:", req.body);

    if (!id_usuario || !nombre_actividad) {
      return res.status(400).json({
        error: "Faltan datos",
      });
    }

    // =========================
    // BUSCAR ACTIVIDAD
    // =========================
    let actividad = await pool.query(
      `
      SELECT id_actividad
      FROM actividad
      WHERE nombre = $1
      `,
      [nombre_actividad]
    );

    let id_actividad;

    // =========================
    // SI NO EXISTE -> CREAR
    // =========================
    if (actividad.rows.length === 0) {

      console.log("➕ CREANDO ACTIVIDAD");

      const nuevaActividad = await pool.query(
        `
        INSERT INTO actividad (
          nombre,
          categoria
        )
        VALUES ($1, $2)
        RETURNING id_actividad
        `,
        [nombre_actividad, "general"]
      );

      id_actividad =
        nuevaActividad.rows[0].id_actividad;

    } else {

      console.log("✅ ACTIVIDAD EXISTE");

      id_actividad =
        actividad.rows[0].id_actividad;
    }

    // =========================
    // INSERT REGISTRO
    // =========================
    const result = await pool.query(
      `
      INSERT INTO registroactividad (
        id_usuario,
        id_actividad,
        nombre_actividad,
        puntaje_agrado,
        frecuencia_deseada,
        reaccion
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        id_usuario,
        id_actividad,
        nombre_actividad,
        puntaje_agrado || 7,
        frecuencia_deseada || "media",
        reaccion || "positiva",
      ]
    );

    console.log("✅ REGISTRO GUARDADO");

    return res.json({
      ok: true,
      registro: result.rows[0],
    });

  } catch (err) {

    console.log("❌ ERROR:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
});

// =========================
// MIS ACTIVIDADES
// =========================
app.get("/mis-actividades/:id", async (req, res) => {

  try {

    const id = req.params.id;

    console.log("👤 USER ID:", id);

    const result = await pool.query(
      `
      SELECT *
      FROM registroactividad
      WHERE id_usuario = $1
      ORDER BY creado_en DESC
      `,
      [id]
    );

    console.log("✅ ACTIVIDADES:", result.rows.length);

    return res.json(result.rows);

  } catch (err) {

    console.log("❌ ERROR:", err);

    return res.status(500).json([]);
  }
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend en puerto ${PORT}`);
});
