import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// 🔓 CORS abierto (frontend puede conectarse)
app.use(cors({ origin: "*" }));

// 📦 JSON parser
app.use(express.json());

// 🔎 LOGS para ver qué llega
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

const MODEL = "models/gemini-2.5-flash";

// 🏠 HOME
app.get("/", (req, res) => {
  res.send(`
    <h2>EmpatIA Backend activo 🤖</h2>
    <p>Endpoints:</p>
    <ul>
      <li>POST /chat</li>
      <li>POST /api/auth/register</li>
    </ul>
  `);
});

// 🧪 HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ ok: true });
});


// 🤖 IA CHAT
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
                  text: `Eres EmpatIA, un asistente emocional. Responde corto y empático.\nUsuario: ${message}`,
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
    console.error("CHAT ERROR:", error);
    res.status(500).json({ reply: "Error en IA 😢" });
  }
});


// 🧑‍💻 REGISTER (SIMULADO SIN BD)
app.post("/api/auth/register", (req, res) => {
  console.log("📩 REGISTER:", req.body);

  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({
      error: "Faltan datos",
    });
  }

  return res.json({
    ok: true,
    user: {
      nombre,
      email,
    },
  });
});


// 🚀 START SERVER
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Backend en puerto", PORT);
});
