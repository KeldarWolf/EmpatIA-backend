import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const MODEL = "gemini-1.5-flash"; // más estable

app.get("/", (req, res) => {
  res.send(`
    <h2>Backend activo 🤖 EmpatIA</h2>
    <p>POST /chat para usar la IA</p>
  `);
});

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "Mensaje vacío 🤍" });
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
Eres EmpatIA 🤍
Un asistente emocional.
Responde corto, humano y empático.

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
      console.error("Gemini error:", errText);

      return res.status(500).json({
        reply: "Error en IA 😢 (API falló)",
      });
    }

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Te leo 🤍";

    res.json({ reply });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    res.status(500).json({
      reply: "Error en servidor 😢",
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Backend EmpatIA en puerto", PORT);
});
