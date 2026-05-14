import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// LOG requests
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// HOME
app.get("/", (req, res) => {
  res.send("EmpatIA Backend activo 🚀");
});

// =========================
// CHAT (EMPATIA IA)
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    console.log("🔥 USER MESSAGE:", message);

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          temperature: 0.9,
          contents: [
            {
              parts: [
                {
                  text: `
Eres EmpatIA, una inteligencia artificial emocional.

Reglas:
- Responde SIEMPRE breve (1 o 2 frases máximo)
- Sé cálida, humana y cercana
- Acompaña emocionalmente al usuario
- Haz preguntas simples para continuar la conversación
- Evita respuestas repetidas como "Te escucho"
- Si el usuario está triste, valida su emoción primero
- Si el usuario habla de aburrimiento o malestar, acompaña y sugiere conversación

Usuario:
${message}
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await r.json();

    console.log("🔥 GEMINI RAW RESPONSE:", JSON.stringify(data, null, 2));

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join("") || null;

    if (!reply) {
      console.error("❌ Gemini no respondió correctamente", data);
      return res.status(500).json({
        reply: "No pude generar respuesta en este momento",
      });
    }

    res.json({ reply });
  } catch (error) {
    console.error("❌ CHAT ERROR:", error);

    res.status(500).json({
      reply: "Error conexión con IA",
    });
  }
});

// =========================
// PORT
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Backend en puerto", PORT);
});
