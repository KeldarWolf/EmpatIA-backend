import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const MODEL = "models/gemini-2.5-flash";

app.get("/", (req, res) => {
  res.send(`
    <h2>Backend activo 🤖</h2>
    <p>Prueba con tu app React o usa /chat (POST)</p>
  `);
});

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
                  text: `Eres EmpatIA, un asistente emocional.
Responde corto, humano y empático.
Usuario: ${message}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await r.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.error?.message ||
      "Te leo 🤍";

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Error en IA 😢" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("🚀 Backend en puerto", PORT);
});