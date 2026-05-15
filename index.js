import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// =========================
// MODELOS (fallback automático)
// =========================
const MODELS = [
  "models/gemini-1.5-flash-latest",
  "models/gemini-1.5-pro-latest",
];

// =========================
// LOG
// =========================
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// =========================
// FUNCION IA CON FALLBACK
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

  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  return {
    ok: r.ok,
    status: r.status,
    reply,
    data,
  };
};

// =========================
// CHAT IA (AUTO MODEL SELECT)
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  console.log("🔥 ENTRÓ A /CHAT:", message);

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

      if (result.ok && result.reply) {
        console.log("✅ USANDO MODELO:", model);
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

  // fallback final
  return res.json({
    reply: "🤍 No pude responder ahora, pero sigo contigo.",
    errorType: "ALL_MODELS_FAILED",
  });
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 EmpatIA backend en puerto", PORT);
});
