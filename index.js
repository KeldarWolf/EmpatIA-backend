import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.send("🚀 EmpatIA backend activo");
});

// =========================
// CHAT IA
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({
      reply: "🤍 Cuéntame cómo te sientes.",
      errorType: "EMPTY",
    });
  }

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
Eres EmpatIA:
- Responde corto
- Empático
- 1 o 2 frases máximo
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    const raw = await r.text();
    let data = null;

    try {
      data = JSON.parse(raw);
    } catch {}

    // =========================
    // ERROR GEMINI
    // =========================
    if (!r.ok) {
      const msg = raw.toLowerCase();

      // 🚨 TOKEN / CUOTA
      if (
        r.status === 429 ||
        msg.includes("quota") ||
        msg.includes("resource_exhausted")
      ) {
        return res.json({
          reply: "🤍 Ahora mismo no tengo tokens disponibles.",
          errorType: "TOKEN_LIMIT",
        });
      }

      return res.json({
        reply: "🤍 IA no disponible ahora.",
        errorType: "IA_ERROR",
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return res.json({
      reply: reply || "🤍 No pude responder.",
    });
  } catch (error) {
    return res.json({
      reply: "🤍 Error de conexión.",
      errorType: "IA_ERROR",
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("🚀 Backend listo en puerto", PORT);
});
