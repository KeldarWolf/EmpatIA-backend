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
// LOG GENERAL
// =========================
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// =========================
// ROUTES ADMIN / AUTH
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// =========================
// ENV CHECK (CLAVE PARA TU ERROR)
// =========================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log("❌ FALTAN VARIABLES SUPABASE_URL O SUPABASE_KEY");
}

// =========================
// GEMINI IA
// =========================
const MODEL = "models/gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
Eres EmpatIA.
Respondes corto, empático y humano.
`;

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
              parts: [{ text: `${SYSTEM_PROMPT}\nUsuario: ${message}` }],
            },
          ],
        }),
      }
    );

    const data = await r.json();

    return {
      ok: true,
      reply: data?.candidates?.[0]?.content?.parts?.[0]?.text,
    };
  } catch (e) {
    console.log("❌ GEMINI ERROR:", e);
    return { ok: false };
  }
}

// =========================
// CHAT
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  const result = await callGemini(message);

  if (!result.ok) {
    return res.json({ reply: "🤍 No puedo responder ahora" });
  }

  res.json({ reply: result.reply });
});

// =========================
// GUARDAR ACTIVIDAD (SUPABASE FIX REAL)
// =========================
app.post("/registro-actividad", async (req, res) => {
  const {
    id_usuario,
    nombre_actividad,
    puntaje_agrado,
    frecuencia_deseada,
    reaccion,
  } = req.body;

  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: "SUPABASE NO CONFIGURADO" });
    }

    const r = await fetch(`${SUPABASE_URL}/rest/v1/registroactividad`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        id_usuario,
        nombre_actividad,
        puntaje_agrado,
        frecuencia_deseada,
        reaccion,
      }),
    });

    const data = await r.json();

    console.log("📩 INSERT RESPONSE:", data);

    res.json(data?.[0] || { ok: true });
  } catch (err) {
    console.log("❌ ERROR DB:", err);
    res.status(500).json({ error: "DB ERROR" });
  }
});

// =========================
// GET ACTIVIDADES USUARIO
// =========================
app.get("/mis-actividades/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/registroactividad?id_usuario=eq.${id}&select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const data = await r.json();
    res.json(data || []);
  } catch (err) {
    console.log("❌ GET ACTIVIDADES ERROR:", err);
    res.json([]);
  }
});

// =========================
// UPDATE GUSTO
// =========================
app.patch("/registro-actividad/:id", async (req, res) => {
  const { id } = req.params;
  const { puntaje_agrado } = req.body;

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/registroactividad?id_registro=eq.${id}`,
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ puntaje_agrado }),
      }
    );

    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.log("❌ PATCH ERROR:", err);
    res.status(500).json({ error: "UPDATE ERROR" });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend corriendo en puerto ${PORT}`);
});
