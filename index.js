// =========================
// INDEX.JS COMPLETO MOD
// =========================

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
// OBTENER ACTIVIDADES BASE
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
  } catch (err) {
    console.log(err);
    res.json([]);
  }
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
    const search = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/actividad?nombre=eq.${encodeURIComponent(
        nombre_actividad
      )}&select=*`,
      {
        headers: {
          apikey: process.env.SUPABASE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
        },
      }
    );

    const actividades = await search.json();

    let id_actividad = null;

    // =========================
    // SI NO EXISTE -> CREAR
    // =========================
    if (!actividades?.length) {
      console.log("🆕 CREANDO ACTIVIDAD");

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
              nombre: nombre_actividad,
              descripcion: nombre_actividad,
              categoria: "general",
            },
          ]),
        }
      );

      const nuevaActividad = await create.json();

      console.log("✅ ACTIVIDAD CREADA:", nuevaActividad);

      id_actividad = nuevaActividad?.[0]?.id_actividad;
    } else {
      id_actividad = actividades[0].id_actividad;
    }

    console.log("🎯 ID ACTIVIDAD:", id_actividad);

    // =========================
    // INSERTAR REGISTRO
    // =========================
    const insert = await fetch(
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
            nombre_actividad,
            puntaje_agrado: puntaje_agrado || 7,
            frecuencia_deseada:
              frecuencia_deseada || "media",
            reaccion: reaccion || "positiva",
          },
        ]),
      }
    );

    const data = await insert.json();

    console.log("✅ REGISTRO:", data);

    res.json(data?.[0] || {});
  } catch (err) {
    console.log("❌ ERROR:", err);

    res.status(500).json({
      error: "Error guardando actividad",
    });
  }
});

// =========================
// MIS ACTIVIDADES
// =========================
app.get("/mis-actividades/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("👤 USER ID:", id);

    const r = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/registroactividad?id_usuario=eq.${id}&order=creado_en.desc&select=*`,
      {
        headers: {
          apikey: process.env.SUPABASE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
        },
      }
    );

    const data = await r.json();

    console.log("📦 ACTIVIDADES USER:", data);

    res.json(data || []);
  } catch (err) {
    console.log(err);
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
