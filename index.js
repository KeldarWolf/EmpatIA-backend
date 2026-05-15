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
// LOG GLOBAL
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
// 10 MODELOS (FALLBACK REAL)
// =========================
const MODELS = [
  "models/gemini-1.5-flash-latest",
  "models/gemini-1.5-pro-latest",
  "models/gemini-1.5-flash",
  "models/gemini-1.5-pro",
  "models/gemini-1.0-pro",
  "models/gemini-pro",
  "models/gemini-pro-vision",
  "models/gemini-1.0-flash",
  "models/gemini-1.5-flash-001",
  "models/gemini-1.5-pro-001",
];

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
                text: `
Eres EmpatIA:
- Responde corto
- Empático
- Humano

Usuario: ${message}
                `,
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
    data,
  };
};

// =========================
// CHAT IA (AUTO DETECT 10 MODELOS)
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

  for (const model of MODELS) {
    try {
      console.log("🤖 Probando modelo:", model);

      const result = await callGemini(model, message);

      console.log("📡 STATUS:", result.status);

      // ✔ ÉXITO
      if (result.ok && result.reply) {
        console.log("✅ MODELO FUNCIONAL:", model);

        return res.json({
          reply: result.reply,
          errorType: null,
          modelUsed: model,
        });
      }

      // ❌ MODELO NO EXISTE (404)
      if (result.status === 404) {
        console.log("⚠️ MODELO NO DISPONIBLE:", model);
        continue;
      }

      // ❌ QUOTA
      if (result.status === 429) {
        console.log("⚠️ QUOTA EN MODELO:", model);
        continue;
      }

    } catch (err) {
      console.log("❌ ERROR MODELO:", model, err.message);
    }
  }

  // =========================
  // FALLBACK FINAL HUMANO
  // =========================
  return res.json({
    reply: "🤍 No pude responder ahora, pero sigo contigo.",
    errorType: "ALL_MODELS_FAILED",
  });
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend en puerto ${PORT}`);
});
