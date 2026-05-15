import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// LOG REQUESTS
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

app.get("/", (req, res) => {
  res.send("🚀 EmpatIA Backend activo");
});

// =========================
// DETECTORES IA
// =========================
const detectQuotaError = (r, data) => {
  const msg = data?.error?.message?.toLowerCase?.() || "";

  return (
    r.status === 429 ||
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("limit")
  );
};

// =========================
// CHAT IA
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.json({
      reply: "🤍 Cuéntame cómo te sientes.",
      errorType: "EMPTY_MESSAGE",
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
- Humano
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await r.json();

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    const msg = data?.error?.message?.toLowerCase?.() || "";

    const isQuota =
      r.status === 429 ||
      msg.includes("quota") ||
      msg.includes("resource_exhausted") ||
      msg.includes("limit");

    const isNetwork = !r.ok && !reply && !isQuota;

    // =========================
    // DEBUG REAL (IMPORTANTE)
    // =========================
    console.log("=== GEMINI DEBUG ===");
    console.log("STATUS:", r.status);
    console.log("OK:", r.ok);
    console.log("REPLY:", reply);
    console.log("ERROR MSG:", msg);
    console.log("FULL DATA:", JSON.stringify(data, null, 2));
    console.log("====================");

    // =========================
    // ERROR: QUOTA / TOKEN
    // =========================
    if (isQuota) {
      return res.json({
        reply: "🤍 La IA está temporalmente saturada.",
        errorType: "QUOTA_LIMIT",
      });
    }

    // =========================
    // ERROR: NETWORK
    // =========================
    if (isNetwork) {
      return res.json({
        reply: "🤍 Problema de conexión con la IA.",
        errorType: "NETWORK_ERROR",
      });
    }

    // =========================
    // ERROR: GENERIC
    // =========================
    if (!reply) {
      return res.json({
        reply: "🤍 No pude generar respuesta.",
        errorType: "GENERIC_ERROR",
      });
    }

    // =========================
    // OK
    // =========================
    return res.json({
      reply,
      errorType: null,
    });

  } catch (error) {
    console.error("❌ SERVER ERROR:", error);

    return res.json({
      reply: "🤍 Error del servidor.",
      errorType: "SERVER_ERROR",
    });
  }
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 EmpatIA backend en puerto ${PORT}`);
});
