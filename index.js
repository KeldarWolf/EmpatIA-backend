import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();
app.use(cors());

app.use(cors({ origin: "*" }));
app.use(express.json());

// =========================
// CONFIG
// LOG MIDDLEWARE
// =========================
const API_KEY = process.env.GEMINI_API_KEY;
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

const MODEL_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
// =========================
// ROUTES
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// =========================
// SYSTEM PROMPT
// HEALTH CHECK
// =========================
const SYSTEM_PROMPT = `
Eres EmpatIA.
Respondes corto, empático y humano.
No eres técnico.
`;
app.get("/", (req, res) => {
  res.send("🚀 EmpatIA Backend activo 🤖");
});

// =========================
// LOG HELPER
// CONFIG IA
// =========================
const log = (...args) => console.log("🤖", ...args);
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
// CHAT ENDPOINT
// CHAT IA
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  log("ENTRÓ A /CHAT");
  log("MESSAGE:", message);
  console.log("🔥 ENTRÓ A /CHAT");
  console.log("📩 MESSAGE:", message);

  if (!message?.trim()) {
    return res.json({
      reply: "🤍 Cuéntame cómo te sientes.",
      error: "EMPTY_MESSAGE",
      errorType: "EMPTY_MESSAGE",
    });
  }

  try {
    log("LLAMANDO A GEMINI...");

    const response = await fetch(
      `${MODEL_URL}?key=${API_KEY}`,
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\nUsuario: ${message}`,
@@ -67,73 +84,121 @@ app.post("/chat", async (req, res) => {
      }
    );

    const data = await response.json();

    log("STATUS:", response.status);
    log("RAW:", JSON.stringify(data));

    // =========================
    // ERROR HANDLING
    // =========================
    if (!response.ok) {
      const msg = data?.error?.message || "Error Gemini";
    const data = await r.json();

      log("❌ GEMINI ERROR:", msg);

      return res.json({
        reply: "🤍 La IA está temporalmente saturada. ¿Quieres intentar una actividad?",
        error: "GEMINI_ERROR",
        status: response.status,
      });
    }

    const text =
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("📡 STATUS:", r.status);

    // =========================
    // EMPTY RESPONSE SAFE
    // ERROR GEMINI
    // =========================
    if (!text) {
      log("⚠️ EMPTY RESPONSE");
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
        reply: "🤍 No pude responder ahora, pero estoy contigo.",
        error: "EMPTY_RESPONSE",
        reply:
          "🤍 No puedo responder ahora. ¿Quieres hacer una actividad conmigo?",
        errorType: "GENERIC_ERROR",
      });
    }

    // =========================
    // SUCCESS
    // =========================
    return res.json({
      reply: text,
      ok: true,
      reply,
      model: MODEL,
      errorType: null,
    });

  } catch (err) {
    log("❌ SERVER ERROR:", err.message);
    console.log("❌ SERVER ERROR:", err.message);

    return res.json({
      reply: "🤍 Error de conexión. Intenta nuevamente.",
      error: "NETWORK_ERROR",
      reply:
        "🤍 Error de conexión. Pero estoy contigo, ¿quieres hacer una actividad?",
      errorType: "NETWORK_ERROR",
    });
  }
});

// =========================
// HEALTH CHECK
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
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "EmpatIA backend",
    time: new Date().toISOString(),
  });
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
// START
// START SERVER
// =========================
app.listen(3001, () => {
  console.log("🚀 EmpatIA corriendo en puerto 3001");
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend en puerto ${PORT}`);
}); 
