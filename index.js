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
// OBTENER MODELOS REALES
// =========================
const getModels = async () => {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );

    const data = await r.json();

    console.log("📦 MODELOS DISPONIBLES:", JSON.stringify(data, null, 2));

    return data?.models?.map((m) => m.name) || [];
  } catch (err) {
    console.log("❌ ERROR LISTANDO MODELOS:", err.message);
    return [];
  }
};

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
// CHAT IA (DINÁMICO REAL)
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

  const models = await getModels();

  if (!models.length) {
    return res.json({
      reply: "🤍 No se pudieron cargar modelos de IA.",
      errorType: "NO_MODELS",
    });
  }

  console.log("🤖 MODELOS A USAR:", models);

  for (const model of models) {
    try {
      console.log("⚡ Probando:", model);

      const result = await callGemini(model, message);

      console.log("📡 STATUS:", result.status);

      if (result.ok && result.reply) {
        console.log("✅ MODELO FUNCIONAL:", model);
        console.log("💬 RESPUESTA:", result.reply);

        return res.json({
          reply: result.reply,
          errorType: null,
          modelUsed: model,
        });
      }

    } catch (err) {
      console.log("❌ ERROR MODELO:", model, err.message);
    }
  }

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
