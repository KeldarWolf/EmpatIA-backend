import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Logger de peticiones
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// Ruta principal
app.get("/", (req, res) => {
  res.send("✅ EmpatIA Backend activo 🚀");
});

// ========================= CHAT IA =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ reply: "Cuéntame cómo te sientes..." });
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
          maxOutputTokens: 160,
          contents: [{
            parts: [{
              text: `
Eres EmpatIA, una acompañante emocional cálida y humana.
Reglas importantes:
- Responde siempre con máximo 1-2 frases cortas.
- Sé cercana, calmada y empática.
- Nunca uses la frase "Te escucho".
- Valida las emociones suavemente.

Usuario: ${message}
              `
            }]
          }]
        })
      }
    );

    const data = await r.json();

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (reply && reply.length > 5) {
      console.log("✅ Respuesta Gemini OK");
      return res.json({ reply });
    } else {
      console.error("❌ Gemini devolvió respuesta vacía");
      throw new Error("Respuesta vacía");
    }

  } catch (error) {
    console.error("❌ ERROR EN IA:", error.message);

    // Respuesta visible con error + oferta de actividad
    return res.json({
      reply: `Error con la IA: ${error.message}\n\nLo siento, no puedo responder ahora pero puedo ayudarte con actividades. ¿Quieres?`
    });
  }
});

// ========================= PORT =========================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
