import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

app.get("/", (req, res) => {
  res.send("🚀 EmpatIA Backend activo");
});

// =========================
// DETECTOR DE CUOTA
// =========================
const detectQuotaError = (r, data) => {
  const msg =
    data?.error?.message?.toLowerCase() || "";

  return (
    r.status === 429 ||
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("rate limit") ||
    msg.includes("limit exceeded")
  );
};

// =========================
// CHAT IA
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.json({
      reply: "🤍 Cuéntame cómo te sientes.",
    });
  }

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
Eres EmpatIA:
- Responde corto (1-2 frases)
- Empático y humano
- Acompaña emocionalmente
                `,
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

    // =========================
    // ERROR IA
    // =========================
    if (!r.ok || !reply) {
      const isQuota = detectQuotaError(r, data);

      console.error("❌ GEMINI ERROR COMPLETO:", data);

      // 🔴 CASO: SIN TOKENS / CUOTA
      if (isQuota) {
        return res.json({
          reply:
            "🤍 Ahora mismo no tengo tokens disponibles para responder.",
          errorType: "TOKEN_LIMIT",
          activityMode: true,
        });
      }

      // 🔴 OTRO ERROR
      return res.json({
        reply:
          "🤍 No puedo responder en este momento.",
        errorType: "GENERIC_ERROR",
        activityMode: true,
      });
    }

    // =========================
    // OK
    // =========================
    return res.json({
      reply,
      errorType: null,
      activityMode: false,
    });

  } catch (error) {
    console.error("❌ SERVER ERROR:", error);

    return res.json({
      reply:
        "🤍 Error de conexión con la IA.",
      errorType: "NETWORK_ERROR",
      activityMode: true,
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend en puerto ${PORT}`);
});
