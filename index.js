import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ Modelo Gemini
const MODEL = "gemini-1.5-flash";

// ✅ Ruta base
app.get("/", (req, res) => {
  res.send("🚀 Backend EmpatIA activo");
});

// ✅ CHAT IA
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  // validar mensaje
  if (!message || !message.trim()) {
    return res.status(400).json({
      reply: "Mensaje vacío",
    });
  }

  try {
    // 🔥 petición Gemini
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
- No uses respuestas largas
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

    // ❌ error HTTP Gemini
    if (!response.ok) {
      const errText = await response.text();

      console.error("GEMINI HTTP ERROR:");
      console.error(errText);

      return res.status(response.status).json({
        reply: errText,
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
        reply: data.error.message,
      });
    }

    // ✅ texto IA
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    // ❌ sin respuesta
    if (!reply) {
      return res.status(500).json({
        reply: "Gemini no devolvió texto",
      });
    }

    // ✅ respuesta final
    res.json({ reply });

  } catch (error) {
    console.error("SERVER ERROR:");
    console.error(error);

    res.status(500).json({
      reply: error.message || "Error servidor",
    });
  }
});

// ✅ puerto Render/local
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
