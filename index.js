import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const MODEL = "models/gemini-2.5-flash";

app.get("/", (req, res) => {
  res.send("EmpatIA backend activo 🤖");
});

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Eres EmpatIA.
Responde natural, corto y humano.
No uses frases repetidas.
Usuario: ${message}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await r.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Te escucho 🤍";

    res.json({ reply });

  } catch (error) {
    res.status(500).json({ reply: "Error IA" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 IA corriendo en puerto", PORT);
});
