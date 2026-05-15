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
// MODELO ÚNICO (ESTABLE)
// =========================
const MODEL = "models/gemma-4-26b-a4b-it";

// =========================
// PROMPT EMPATIA
// =========================
const SYSTEM_PROMPT = `
Eres EmpatIA.
- Responde corto
- Empático
- Humano
- No devuelvas instrucciones ni análisis del prompt
`;

// =========================
// GEMINI CALL
// =========================
const callGemini = async (message) => {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
    const result = await callGemini(message);

    console.log("📡 STATUS:", result.status);

    if (result.ok && result.reply) {
      return res.json({
        reply: result.reply,
        modelUsed: MODEL,
      });
    }

    return res.json({
      reply: "🤍 Lo siento, ahora mismo no puedo responder.",
      errorType: "MODEL_ERROR",
    });

  } catch (err) {
    console.log("❌ ERROR IA:", err.message);

    return res.json({
      reply: "🤍 Error de conexión, intenta nuevamente.",
      errorType: "NETWORK_ERROR",
    });
  }
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend en puerto ${PORT}`);
});
