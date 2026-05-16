import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json());

// =========================
// ROUTES BASE
// ROUTES
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// =========================
// HEALTH CHECK
// HOME
// =========================
app.get("/", (req, res) => {
  res.send("🚀 EmpatIA Backend activo");
  res.send("🚀 Backend EmpatIA activo");
});

// =========================
// CHAT IA (GEMINI)
// GEMINI CONFIG
// =========================
const MODEL = "gemini-2.0-flash";

// =========================
// CHAT IA
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;
@@ -39,7 +47,7 @@

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
@@ -53,10 +61,13 @@
                  text: `
Eres EmpatIA.

Reglas:
- Responde corto
- 1 o 2 frases
- Máximo 2 frases
- Empático y humano
- Sin explicaciones largas
- Nunca robot
- Primero acompaña emocionalmente
- Luego sugerencia opcional

Usuario: ${message}
                  `,
@@ -71,14 +82,16 @@
    if (!response.ok) {
      const err = await response.text();

      console.error("ERROR GEMINI:", err);

      if (response.status === 429) {
        return res.json({
          reply: "🤍 IA sin tokens disponibles ahora mismo.",
        return res.status(429).json({
          reply: "🤍 Sin tokens disponibles ahora mismo.",
        });
      }

      return res.json({
        reply: "😢 Error con la IA.",
      return res.status(response.status).json({
        reply: "😢 Error con la IA",
      });
    }

@@ -87,95 +100,27 @@
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
    if (!reply) {
      return res.json({
        online: false,
        token: false,
        model: "gemini-2.0-flash",
        message: "API KEY no configurada",
        reply: "😢 Sin respuesta de la IA",
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
    res.json({ reply });
  } catch (error) {
    return res.json({
      online: false,
      token: false,
      model: "error",
      message: "Sin conexión con IA",
    console.error(error);

    res.status(500).json({
      reply: "Error del servidor",
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
  console.log(`🚀 Server running on port ${PORT}`);
});
