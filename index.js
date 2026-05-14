import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// Home
app.get("/", (req, res) => {
  res.send("✅ EmpatIA Backend activo 🚀");
});

// ========================= CHAT ENDPOINT =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ reply: "No recibí tu mensaje" });
  }

  try {
    console.log("🔥 USER MESSAGE:", message);

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature: 0.85,
          maxOutputTokens: 180,           // ← Control de tokens
          contents: [{
            parts: [{
              text: `
Eres EmpatIA, una acompañante emocional cálida y breve.
Reglas:
- Responde siempre máximo 1-2 frases cortas.
- Sé humana, cercana y calmada.
- Nunca uses "Te escucho".
- Valida emociones suavemente.

Usuario: ${message}
              `
            }]
          }]
        })
      }
    );

    const data = await r.json();

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      ?.join("")
      ?.trim();

    if (reply) {
      console.log("✅ Respuesta generada");
      return res.json({ reply });
    } else {
      console.error("❌ Gemini no devolvió respuesta válida");
    }

  } catch (error) {
    console.error("❌ CHAT ERROR:", error.message);
  }

  // Fallback útil
  res.json({
    reply: "Lo siento, no puedo responder ahora pero puedo ayudarte con actividades. ¿Quieres?"
  });
});

// ========================= PORT =========================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
