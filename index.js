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
// LOG MIDDLEWARE
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
// HEALTH CHECK
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
- Respondes corto
- Empático
- Humano
- No técnico
`;

// =========================
// CHAT IA
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

    console.log("📡 STATUS:", r.status);

    // =========================
    // ERROR GEMINI
    // =========================
    if (!r.ok || !reply) {
      console.log("❌ GEMINI ERROR:", data);

      if (r.status === 429) {
        return res.json({
          reply:
            "🤍 La IA está saturada en este momento. ¿Quieres iniciar una actividad para sentirte mejor?",
          errorType: "TOKEN_LIMIT",
        });
      }

      return res.json({
        reply:
          "🤍 No puedo responder ahora. ¿Quieres hacer una actividad conmigo?",
        errorType: "GENERIC_ERROR",
      });
    }

    return res.json({
      reply,
      model: MODEL,
      errorType: null,
    });
  } catch (err) {
    console.log("❌ SERVER ERROR:", err.message);

    return res.json({
      reply:
        "🤍 Error de conexión. Pero estoy contigo, ¿quieres hacer una actividad?",
      errorType: "NETWORK_ERROR",
    });
  }
});

// =========================
// ACTIVIDADES CATÁLOGO
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
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error cargando actividades" });
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

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: "Error guardando registro" });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend en puerto ${PORT}`);
});
