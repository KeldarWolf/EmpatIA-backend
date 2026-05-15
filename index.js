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
// MODELOS (ORDEN DE PRIORIDAD)
// =========================
const MODEL_1 = "models/gemini-2.5-flash";
const MODEL_2 = "models/gemini-2.0-flash";
const MODEL_3 = "models/gemini-1.5-flash-latest";

// =========================
// PROMPT EMPATIA
// =========================
const SYSTEM_PROMPT = `
Eres EmpatIA.
- Responde corto
- Empático
- Humano
- Sin explicaciones largas
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
// CHAT IA (FALLBACK LINEAL 3 PASOS)
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

  // =========================
  // 1️⃣ INTENTO 1
  // =========================
  try {
    console.log("🤖 PROBANDO MODEL 1:", MODEL_1);

    const r1 = await callGemini(MODEL_1, message);

    console.log("📡 STATUS 1:", r1.status);

    if (r1.ok && r1.reply) {
      return res.json({
        reply: r1.reply,
        modelUsed: MODEL_1,
      });
    }
  } catch (e) {
    console.log("❌ ERROR MODEL 1");
  }

  // =========================
  // 2️⃣ INTENTO 2
  // =========================
  try {
    console.log("🤖 PROBANDO MODEL 2:", MODEL_2);

    const r2 = await callGemini(MODEL_2, message);

    console.log("📡 STATUS 2:", r2.status);

    if (r2.ok && r2.reply) {
      return res.json({
        reply: r2.reply,
        modelUsed: MODEL_2,
      });
    }
  } catch (e) {
    console.log("❌ ERROR MODEL 2");
  }

  // =========================
  // 3️⃣ INTENTO 3
  // =========================
  try {
    console.log("🤖 PROBANDO MODEL 3:", MODEL_3);

    const r3 = await callGemini(MODEL_3, message);

    console.log("📡 STATUS 3:", r3.status);

    if (r3.ok && r3.reply) {
      return res.json({
        reply: r3.reply,
        modelUsed: MODEL_3,
      });
    }
  } catch (e) {
    console.log("❌ ERROR MODEL 3");
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
