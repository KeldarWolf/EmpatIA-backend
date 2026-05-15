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

// =========================
// ROUTES
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// =========================
// HOME
// =========================
app.get("/", (req, res) => {
  res.send("🚀 Backend EmpatIA activo");
});

// =========================
// GEMINI CONFIG
// =========================
const MODEL = "gemini-2.0-flash";

// =========================
// CHAT IA
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.json({
      reply: "¿Cómo te sientes hoy? 🤍",
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
Eres EmpatIA.

Reglas:
- Responde corto
- Máximo 2 frases
- Empático y humano
- Nunca robot
- Primero acompaña emocionalmente
- Luego sugerencia opcional

Usuario: ${message}
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();

      console.error("ERROR GEMINI:", err);

      if (response.status === 429) {
        return res.status(429).json({
          reply: "🤍 Sin tokens disponibles ahora mismo.",
        });
      }

      return res.status(response.status).json({
        reply: "😢 Error con la IA",
      });
    }

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.json({
        reply: "😢 Sin respuesta de la IA",
      });
    }

    res.json({ reply });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      reply: "Error del servidor",
    });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
