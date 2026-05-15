import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

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
Si no puedes ayudar, sugieres una actividad suave.
`;

// =========================
// IA
// =========================
async function callGemini(message) {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
// OBTENER CATÁLOGO ACTIVIDADES
// =========================
app.get("/actividades", async (req, res) => {
  try {
    const r = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/actividad?select=*`,
      {
        headers: {
          apikey: process.env.SUPABASE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
        },
      }
    );

    const data = await r.json();

    res.json(data || []);
  } catch {
    res.json([]);
  }
});

// =========================
// GUARDAR ACTIVIDAD USUARIO
// =========================
app.post("/guardar-actividad-usuario", async (req, res) => {
  const { id_usuario, texto } = req.body;

  try {
    // BUSCAR ACTIVIDAD
    let r = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/actividad?nombre=eq.${encodeURIComponent(
        texto
      )}&select=*`,
      {
        headers: {
          apikey: process.env.SUPABASE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
        },
      }
    );

    let actividad = await r.json();

    let idActividad = actividad?.[0]?.id_actividad;

    // CREAR SI NO EXISTE
    if (!idActividad) {
      const create = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/actividad`,
        {
          method: "POST",
          headers: {
            apikey: process.env.SUPABASE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify([
            {
              nombre: texto,
              descripcion: texto,
              categoria: "personalizada",
            },
          ]),
        }
      );

      const nuevaActividad = await create.json();

      idActividad = nuevaActividad?.[0]?.id_actividad;
    }

    // REGISTRAR AL USUARIO
    const save = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/registroactividad`,
      {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify([
          {
            id_usuario,
            id_actividad: idActividad,
            fecha: new Date().toISOString(),
            puntaje_agrado: 5,
            frecuencia_deseada: "media",
            reaccion: "guardada",
          },
        ]),
      }
    );

    const data = await save.json();

    res.json(data?.[0] || { ok: true });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Error guardando actividad",
    });
  }
});

// =========================
// ACTIVIDADES DEL USUARIO
// =========================
app.get("/actividades-usuario/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const r = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/registroactividad?id_usuario=eq.${id}&select=*,actividad(*)`,
      {
        headers: {
          apikey: process.env.SUPABASE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
        },
      }
    );

    const data = await r.json();

    res.json(data || []);
  } catch {
    res.json([]);
  }
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend en puerto ${PORT}`);
});
