import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ rutas existentes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// ✅ modelo Gemini
const MODEL = "gemini-2.0-flash";

// ✅ inicio
app.get("/", (req, res) => {
  res.send("🚀 Backend EmpatIA activo");
});

// ✅ chat IA
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  // validar mensaje
  if (!message || !message.trim()) {
    return res.status(400).json({
      reply: "¿Cómo te sientes hoy? 🤍",
    });
  }

  try {
    // 🔥 petición Gemini
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
- Natural y humano
- Cercano y calmado
- No hagas respuestas largas
- Primero acompaña emocionalmente
- Luego puedes sugerir UNA actividad si tiene sentido
- Nunca respondas como robot

Usuario: ${message}
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    // ❌ errores Gemini
    if (!response.ok) {
      const errText = await response.text();

      console.error("GEMINI HTTP ERROR:");
      console.error(errText);

      // 🔴 sin cuota/tokens
      if (
        response.status === 429 ||
        errText.includes("quota") ||
        errText.includes("RESOURCE_EXHAUSTED")
      ) {
        return res.status(429).json({
          reply:
            "🤍 Ahora mismo no puedo conversar porque la IA no tiene tokens disponibles. Intenta nuevamente en un momento.",
        });
      }

      // 🔴 modelo no encontrado
      if (
        response.status === 404 ||
        errText.includes("not found")
      ) {
        return res.status(404).json({
          reply:
            "⚠️ El modelo de IA no está disponible en este momento.",
        });
      }

      // 🔴 api key inválida
      if (
        response.status === 401 ||
        errText.includes("API key")
      ) {
        return res.status(401).json({
          reply:
            "⚠️ Problema con la configuración de la IA.",
        });
      }

      // 🔴 error genérico
      return res.status(response.status).json({
        reply:
          "😢 No pude responder en este momento.",
      });
    }

    // ✅ respuesta Gemini
    const data = await response.json();

    console.log(
      "GEMINI RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    // ❌ error interno Gemini
    if (data.error) {
      return res.status(500).json({
        reply:
          "😢 Ocurrió un error interno con la IA.",
      });
    }

    // ✅ obtener texto IA
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    // ❌ sin texto
    if (!reply) {
      return res.status(500).json({
        reply:
          "😢 La IA no devolvió respuesta.",
      });
    }

    // ✅ respuesta final
    res.json({
      reply,
    });

  } catch (error) {
    console.error("SERVER ERROR:");
    console.error(error);

    res.status(500).json({
      reply:
        "😢 Error del servidor al conectar con la IA.",
    });
  }
});

// ✅ puerto Render/local
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
