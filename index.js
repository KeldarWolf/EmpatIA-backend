import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

// =====================================
// CONFIG
// =====================================
app.use(cors({ origin: "*" }));
app.use(express.json());

// =====================================
// LOGS
// =====================================
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// =====================================
// ROUTES
// =====================================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// =====================================
// HOME
// =====================================
app.get("/", (req, res) => {
  res.send("🚀 EmpatIA Backend activo");
});

// =====================================
// GEMINI
// =====================================
const MODEL = "models/gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

// =====================================
// CHAT IA
// =====================================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

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

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("📡 STATUS:", response.status);

    if (!response.ok || !reply) {
      return res.json({
        reply: "🤍 No puedo responder ahora.",
      });
    }

    return res.json({
      reply,
      model: MODEL,
    });

  } catch (err) {
    console.log("❌ ERROR:", err.message);

    return res.json({
      reply: "🤍 Error de conexión.",
    });
  }
});

// =====================================
// START
// =====================================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Backend en puerto ${PORT}`);
});
