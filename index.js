import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

// ======================================
// CONFIG
// ======================================
const PORT = process.env.PORT || 3001;

const MODEL = "models/gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

// ======================================
// MIDDLEWARES
// ======================================
app.use(cors({ origin: "*" }));
app.use(express.json());

// ======================================
// LOG
// ======================================
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// ======================================
// ROUTES
// ======================================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// ======================================
// HOME
// ======================================
app.get("/", (req, res) => {
  res.send("🚀 EmpatIA Backend activo 🤖");
});

// ======================================
// CHAT IA
// ======================================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  console.log("🔥 ENTRÓ A /CHAT");
  console.log("📩 MESSAGE:", message);

  if (!message?.trim()) {
    return res.json({
      reply: "🤍 Cuéntame cómo te sientes.",
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${API_KEY}`,
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
                  text: message,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("📡 STATUS:", response.status);

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!response.ok || !reply) {
      console.log("❌ RESPUESTA IA INVÁLIDA:", data);

      return res.json({
        reply: "🤍 No puedo responder ahora.",
        errorType: "IA_ERROR",
      });
    }

    return res.json({
      reply,
      model: MODEL,
    });
  } catch (err) {
    console.log("❌ ERROR IA:", err.message);

    return res.json({
      reply: "🤍 Error de conexión.",
      errorType: "NETWORK_ERROR",
    });
  }
});

// ======================================
// 404
// ======================================
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
  });
});

// ======================================
// START
// ======================================
app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend en puerto ${PORT}`);
});
