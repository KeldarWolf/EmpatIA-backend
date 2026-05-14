import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

app.get("/", (req, res) => {
  res.send("✅ EmpatIA Backend activo 🚀");
});

// ========================= CHAT IA =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ reply: "¿Cómo te sientes?" });
  }

  try {
    console.log("🔥 USER:", message);

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature: 0.8,
          maxOutputTokens: 150,
          contents: [{
            parts: [{
              text: `
Eres EmpatIA, una acompañante emocional muy cercana y humana.
Reglas STRICTAS:
- Responde SIEMPRE con 1 o 2 frases cortas máximo.
- Sé cálida y natural.
- NUNCA uses la frase "Te escucho" ni "Te escucho 🤍".
- Valida la emoción del usuario suavemente.
- Mantén el tono calmado y empático.

Usuario: ${message}
              `
            }]
          }]
        })
      }
    );

    const data = await r.json();
    let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    // Limpieza extra
    if (reply) {
      reply = reply.replace(/Te escucho.*/i, "").trim();
    }

    if (reply && reply.length > 5) {
      console.log("✅ Respuesta OK");
      return res.json({ reply });
    }

  } catch (error) {
    console.error("❌ ERROR CHAT:", error.message);
  }

  // Fallback fuerte (el que tú querías)
  res.json({
    reply: "Lo siento, no puedo responder ahora pero puedo ayudarte con actividades. ¿Quieres?"
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
