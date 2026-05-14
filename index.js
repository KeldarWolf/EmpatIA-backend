import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const MODEL = "gemini-1.5-flash";

app.get("/", (req, res) => {
  res.send("🚀 Backend EmpatIA activo");
});

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({
      reply: "Te escucho 🤍",
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
- Si el usuario no sabe qué hacer, sugiere:
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

    // 🔴 ERROR GEMINI
    if (!response.ok) {
      const err = await response.text();

      console.error("GEMINI ERROR:", err);

      return res.status(500).json({
        reply: "No pude conectar con la IA 😢",
      });
    }

    const data = await response.json();

    console.log(data);

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Te escucho 🤍";

    res.json({ reply });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    res.status(500).json({
      reply: "Error del servidor 😢",
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Backend corriendo en puerto", PORT);
});
