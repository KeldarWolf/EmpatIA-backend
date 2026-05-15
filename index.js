import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// =========================
// ROUTES BASE
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.send("🚀 EmpatIA Backend activo");
});

// =========================
// CHAT IA (GEMINI)
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.json({
      reply: "¿Cómo te sientes hoy? 🤍",
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
                  text: `
Eres EmpatIA.

- Responde corto
- 1 o 2 frases
- Empático y humano
- Sin explicaciones largas

Usuario: ${message}
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();

      if (response.status === 429) {
        return res.json({
          reply: "🤍 IA sin tokens disponibles ahora mismo.",
        });
      }

      return res.json({
        reply: "😢 Error con la IA.",
      });
    }

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return res.json({
      reply: reply || "No hubo respuesta.",
    });
  } catch (error) {
    console.error(error);

    return res.json({
      reply: "Error del servidor.",
    });
  }
});

// =========================
// AI STATUS (REAL CHECK)
// =========================
app.get("/api/ai-status", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        online: false,
        token: false,
        model: "gemini-2.0-flash",
        message: "API KEY no configurada",
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: "ping" }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      return res.json({
        online: false,
        token: true,
        model: "gemini-2.0-flash",
        message: "IA caída o sin cuota",
      });
    }

    return res.json({
      online: true,
      token: true,
      model: "gemini-2.0-flash",
      message: "IA operativa",
    });
  } catch (error) {
    return res.json({
      online: false,
      token: false,
      model: "error",
      message: "Sin conexión con IA",
    });
  }
});

// =========================
// SYSTEM STATUS (CPU / RAM REAL NODE)
// =========================
app.get("/api/system-status", (req, res) => {
  const mem = process.memoryUsage();

  const ramMB = Math.round(mem.heapUsed / 1024 / 1024);

  res.json({
    server: "online",
    ram: `${ramMB} MB`,
    uptime: `${Math.floor(process.uptime())}s`,
    database: true,
  });
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
