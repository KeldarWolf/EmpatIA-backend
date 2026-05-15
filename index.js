import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// CONFIG
// =========================
const API_KEY = process.env.GEMINI_API_KEY;

const MODEL_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// =========================
// SYSTEM PROMPT (SOLO BACKEND)
// =========================
const SYSTEM_PROMPT = `
Eres EmpatIA.
Respondes de forma corta, empática y humana.
No eres técnico ni explicativo a menos que te lo pidan.
Siempre mantienes tono cercano.
`;

// =========================
// CHAT ENDPOINT
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Mensaje requerido" });
  }

  try {
    const response = await fetch(
      `${MODEL_URL}?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: SYSTEM_PROMPT + "\nUsuario: " + message,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No pude responder";

    res.json({ reply: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en IA" });
  }
});

// =========================
// HEALTH CHECK (para tu admin panel)
// =========================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "EmpatIA backend",
    time: new Date().toISOString(),
  });
});

// =========================
app.listen(3001, () => {
  console.log("Servidor EmpatIA corriendo en puerto 3001");
});
