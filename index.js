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
// LOG MIDDLEWARE (NO TOCAR)
// =========================
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// =========================
// ROUTES EXISTENTES
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// =========================
// HEALTH
// =========================
app.get("/", (req, res) => {
  res.send("🚀 EmpatIA Backend activo 🤖");
});

// =========================
// CONFIG IA
// =========================
const MODEL = "models/gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
Eres EmpatIA.
- Respuestas cortas
- Empático
- Humano
- No técnico
`;

// =========================
// IA CALL SEGURA
// =========================
const callGemini = async (message) => {
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

    return { ok: r.ok, status: r.status, reply, raw: data };
  } catch (err) {
    return { ok: false, status: 500, reply: null, error: err.message };
  }
};

// =========================
// CHAT IA (MEJORADO SIN ROMPER TU FLUJO)
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  console.log("🔥 ENTRÓ A /CHAT");
  console.log("📩 MESSAGE:", message);

  if (!message?.trim()) {
    return res.json({
      reply: "🤍 Cuéntame cómo te sientes.",
      errorType: "EMPTY_MESSAGE",
    });
  }

  const result = await callGemini(message);

  console.log("📡 STATUS:", result.status);

  // =========================
  // FALLBACK SI FALLA IA
  // =========================
  if (!result.ok || !result.reply) {
    console.log("❌ IA FALLÓ");

    return res.json({
      reply:
        "Lo siento... ahora mismo no puedo responder 🤍 ¿Quieres intentar una actividad para sentirte mejor?",
      errorType: "IA_ERROR",
    });
  }

  return res.json({
    reply: result.reply,
    model: MODEL,
  });
});

// =========================
// ACTIVIDADES (SUPABASE REST - TU MISMO SISTEMA)
// =========================
app.get("/actividades", async (req, res) => {
  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/actividad?select=*`,
      {
        headers: {
          apikey: process.env.SUPABASE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
        },
      }
    );

    const data = await response.json();

    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    res.status(500).json([]);
  }
});

// =========================
// REGISTRO ACTIVIDAD USUARIO
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
    const response = await fetch(
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
            fecha: new Date(),
          },
        ]),
      }
    );

    const data = await response.json();

    res.json(data?.[0] || { ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error guardando actividad" });
  }
});

// =========================
// START SERVER (NO TOCAR)
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend en puerto ${PORT}`);
});
