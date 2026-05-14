import express from "express";
import cors from "cors";
import dotenv from "dotenv";

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
app.get("/", (req, res) => {
  res.send("EmpatIA Backend activo 🚀");
});

// ========================= CHAT ENDPOINT =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "No recibí ningún mensaje" });
  }

  try {
    console.log("🔥 USER MESSAGE:", message);

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature: 0.8,
          maxOutputTokens: 150,        // ← Limitamos tokens
          contents: [{
            parts: [{
              text: `
Eres EmpatIA, una acompañante emocional cálida y breve.
Reglas importantes:
- Responde SIEMPRE con máximo 2 frases cortas.
- Sé humana, cercana y calmada.
- Nunca uses la frase "Te escucho".
- Si el usuario está mal, valida su emoción suavemente.

Usuario: ${message}
              `
            }]
          }]
        })
      }
    );

    const data = await r.json();

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map(p => p.text)
      ?.join("")?.trim() || null;

    if (!reply) {
      console.error("❌ Gemini no devolvió texto");
      return res.json({ 
        reply: "Lo siento, no puedo responder ahora pero puedo ayudarte con actividades. ¿Quieres?" 
      });
    }

    res.json({ reply });

  } catch (error) {
    console.error("❌ CHAT ERROR:", error.message);
    res.json({ 
      reply: "Lo siento, no puedo responder ahora pero puedo ayudarte con actividades. ¿Quieres?" 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
