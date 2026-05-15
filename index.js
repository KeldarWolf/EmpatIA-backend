import express from "express";
import dotenv from "dotenv";
import cors from "cors";

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

app.get("/", (req, res) => {
  res.send("🚀 EmpatIA Backend activo 🤖");
});

// =========================
// CACHE DE MODELOS
// =========================
let cachedModels = [];
let lastUpdate = 0;

// =========================
// OBTENER MODELOS REALES
// =========================
const fetchModels = async () => {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
  );

  const data = await r.json();

  const models = (data.models || [])
    .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
    .map(m => m.name);

  console.log("📦 MODELOS REALES:", models);

  return models;
};

// =========================
// REFRESH CACHE (cada 10 min)
// =========================
const refreshModels = async () => {
  try {
    cachedModels = await fetchModels();
    lastUpdate = Date.now();
  } catch (err) {
    console.log("❌ ERROR MODELOS:", err.message);
  }
};

// inicial
refreshModels();

// cada 10 min
setInterval(refreshModels, 1000 * 60 * 10);

// =========================
// PROMPT EMPATIA
// =========================
const SYSTEM_PROMPT = `
Eres EmpatIA.
- Responde corto
- Empático
- Humano
`;

// =========================
// GEMINI CALL
// =========================
const callGemini = async (model, message) => {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nUsuario: ${message}`,
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await r.json();

  return {
    ok: r.ok,
    status: r.status,
    reply: data?.candidates?.[0]?.content?.parts?.[0]?.text,
  };
};

// =========================
// CHAT IA (USANDO CACHE + AUTO SELECCIÓN)
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

  if (!cachedModels.length) {
    return res.json({
      reply: "🤍 Aún cargando modelos de IA...",
      errorType: "NO_MODELS",
    });
  }

  // 🔥 elegir modelo preferido (flash primero)
  const preferredModel =
    cachedModels.find(m => m.includes("flash")) || cachedModels[0];

  console.log("🤖 MODELO SELECCIONADO:", preferredModel);

  // =========================
  // INTENTO 1 (PREFERIDO)
  // =========================
  try {
    const r1 = await callGemini(preferredModel, message);

    console.log("📡 STATUS:", r1.status);

    if (r1.ok && r1.reply) {
      return res.json({
        reply: r1.reply,
        modelUsed: preferredModel,
      });
    }
  } catch (err) {
    console.log("❌ ERROR MODELO PREFERIDO");
  }

  // =========================
  // FALLBACK 1 SOLO (NO LOOP INFINITO)
  // =========================
  for (const model of cachedModels) {
    if (model === preferredModel) continue;

    try {
      console.log("🤖 FALLBACK:", model);

      const r = await callGemini(model, message);

      if (r.ok && r.reply) {
        return res.json({
          reply: r.reply,
          modelUsed: model,
        });
      }
    } catch (err) {
      console.log("❌ ERROR FALLBACK:", model);
    }
  }

  // =========================
  // FALLBACK FINAL
  // =========================
  return res.json({
    reply: "🤍 Lo siento... sigo aquí contigo.",
    errorType: "ALL_MODELS_FAILED",
  });
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend en puerto ${PORT}`);
});
