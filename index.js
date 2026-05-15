import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   LOGS
========================= */
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.send("EmpatIA Backend activo 🚀");
});

/* =========================
   IA STATS (MEMORIA)
========================= */
let iaStats = {
  requests: 0,
  totalTime: 0,
};

/* =========================
   CHAT IA
========================= */
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  const start = Date.now();

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }],
            },
          ],
        }),
      }
    );

    const data = await r.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Te escucho 🤍";

    const duration = Date.now() - start;

    // 📊 STATS REALES (runtime)
    iaStats.requests++;
    iaStats.totalTime += duration;

    res.json({ reply });

  } catch (error) {
    console.error("CHAT ERROR:", error);
    res.status(500).json({ reply: "Error IA" });
  }
});

/* =========================
   IA STATUS (ADMIN)
========================= */
app.get("/api/ai/status", (req, res) => {
  const avg =
    iaStats.requests === 0
      ? 0
      : Math.round(iaStats.totalTime / iaStats.requests);

  res.json({
    online: true,
    requests: iaStats.requests,
    avgResponseTime: avg,
    estimatedTokens: iaStats.requests * 120,
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Backend en puerto", PORT);
});
