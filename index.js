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
// LOG (NO TOCAR)
// =========================
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// =========================
// ROUTES BASE
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
// IA CALL
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
// CHAT IA
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
// SUPABASE ACTIVIDADES
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
    return res.json(data || []);
  } catch (err) {
    return res.json([]);
  }
});

// =========================
// REGISTRAR ACTIVIDAD USUARIO
// =========================
app.post("/registro-actividad", async (req, res) => {
  const {
    id_usuario,
    id_actividad,
    puntaje_agrado,
    frecuencia_deseada,
    reaccion,
  } = req.body;

  try {
    const r = await fetch(
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
            id_actividad,
            puntaje_agrado,
            frecuencia_deseada,
            reaccion,
            fecha: new Date().toISOString(),
          },
        ]),
      }
    );

    const data = await r.json();

    return res.json(data?.[0] || { ok: true });
  } catch (err) {
    return res.status(500).json({ error: "DB ERROR" });
  }
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend en puerto ${PORT}`);
});
