import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ rutas auth
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// ✅ modelo IA
const MODEL = "gemini-1.5-flash";

// ✅ inicio
app.get("/", (req, res) => {
  res.send("🚀 Backend EmpatIA activo");
});

// ✅ CHAT IA
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      reply: "Mensaje vacío",
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
- Natural y humano
- Si el usuario no sabe qué hacer,
  sugiere SOLO UNA actividad:
  caminar, respirar, música o escribir

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
      const errText = await response.text();

      console.error("GEMINI ERROR:");
      console.error(errText);

      return res.status(response.status).json({
        reply: errText,
      });
    }

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    res.json({
      reply: reply || "Sin respuesta IA",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      reply: error.message || "Error servidor",
    });
  }
});

// ✅ puerto
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
