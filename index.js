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

// LOG REQUESTS
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
  res.send("EmpatIA Backend activo 🚀");
});

// =========================
// CHAT IA (GEMINI)
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      reply: "¿Cómo te sientes hoy? 🤍",
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
- Responde corto y humano
- 1 o 2 frases máximo
- Acompaña emocionalmente primero
- Si el usuario está mal o no sabe qué hacer, sugiere suavemente una actividad
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    // =========================
    // ERROR GEMINI
    // =========================
    if (!r.ok) {
      const errText = await r.text();

      console.error("❌ GEMINI ERROR:", errText);

      // 🚨 SIN CUOTA / TOKENS
      if (
        r.status === 429 ||
        errText.includes("quota") ||
        errText.includes("RESOURCE_EXHAUSTED")
      ) {
        return res.json({
          reply:
            "🤍 Ahora mismo la IA no está disponible por falta de tokens o cuota.\n\n¿Quieres que te ayude con una actividad para sentirte mejor?",
          activityMode: true,
        });
      }

      // 🚨 MODELO O ERROR GENERAL
      return res.json({
        reply:
          "🤍 La IA no está disponible en este momento.\n\n¿Quieres que hagamos una actividad juntos?",
        activityMode: true,
      });
    }

    const data = await r.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.json({
        reply:
          "🤍 No pude generar respuesta ahora.\n\n¿Quieres hacer una actividad?",
        activityMode: true,
      });
    }

    return res.json({ reply });
  } catch (error) {
    console.error("❌ CHAT ERROR:", error);

    return res.status(500).json({
      reply:
        "🤍 Error de conexión con la IA.\n\n¿Quieres intentar una actividad para relajarte?",
      activityMode: true,
    });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend corriendo en puerto ${PORT}`);
});
