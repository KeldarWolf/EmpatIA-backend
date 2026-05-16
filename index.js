import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json());

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
// HOME
// =========================
app.get("/", (req, res) => {
  res.send("🚀 EmpatIA Backend activo");
});

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
- Acompaña emocionalmente primero
- Sé humano y cercano
- Si el usuario está mal o confundido, ofrece ayuda suave
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    // =========================
    // ERROR IA
    // =========================
    if (!r.ok) {
      const err = await r.text();

      console.error("❌ GEMINI ERROR:", err);

      // 🚨 SIN CUOTA / TOKEN
      if (
        r.status === 429 ||
        err.includes("quota") ||
        err.includes("RESOURCE_EXHAUSTED")
      ) {
        return res.json({
          reply:
            "🤍 Ahora mismo la IA no está disponible.\n\n¿Quieres que te ayude con una actividad para sentirte mejor?",
          activityMode: true,
        });
      }

      // 🚨 OTRO ERROR
      return res.json({
        reply:
          "🤍 La IA no está disponible en este momento.\n\n¿Quieres hacer una actividad?",
        activityMode: true,
      });
    }

    const data = await r.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.json({
        reply:
          "🤍 No pude responder ahora.\n\n¿Quieres hacer una actividad?",
        activityMode: true,
      });
    }

    return res.json({ reply });
  } catch (error) {
    console.error("❌ SERVER ERROR:", error);

    return res.json({
      reply:
        "🤍 Error de conexión.\n\n¿Quieres intentar una actividad para relajarte?",
      activityMode: true,
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
