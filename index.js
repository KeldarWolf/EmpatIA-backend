import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// CONFIG
// =========================
const API_KEY = process.env.GEMINI_API_KEY;

const MODEL_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// =========================
// SYSTEM PROMPT
// =========================
const SYSTEM_PROMPT = `
Eres EmpatIA.
Respondes corto, empático y humano.
No eres técnico.
`;

// =========================
// LOG HELPER
// =========================
const log = (...args) => console.log("🤖", ...args);

// =========================
// CHAT ENDPOINT
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  log("ENTRÓ A /CHAT");
  log("MESSAGE:", message);

  if (!message?.trim()) {
    return res.json({
      reply: "🤍 Cuéntame cómo te sientes.",
      error: "EMPTY_MESSAGE",
    });
  }

  try {
    log("LLAMANDO A GEMINI...");

    const response = await fetch(
      `${MODEL_URL}?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\nUsuario: ${message}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    log("STATUS:", response.status);
    log("RAW:", JSON.stringify(data));

    // =========================
    // ERROR HANDLING
    // =========================
    if (!response.ok) {
      const msg = data?.error?.message || "Error Gemini";

      log("❌ GEMINI ERROR:", msg);

      return res.json({
        reply: "🤍 La IA está temporalmente saturada. ¿Quieres intentar una actividad?",
        error: "GEMINI_ERROR",
        status: response.status,
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    // =========================
    // EMPTY RESPONSE SAFE
    // =========================
    if (!text) {
      log("⚠️ EMPTY RESPONSE");

      return res.json({
        reply: "🤍 No pude responder ahora, pero estoy contigo.",
        error: "EMPTY_RESPONSE",
      });
    }

    // =========================
    // SUCCESS
    // =========================
    return res.json({
      reply: text,
      ok: true,
    });

  } catch (err) {
    log("❌ SERVER ERROR:", err.message);

    return res.json({
      reply: "🤍 Error de conexión. Intenta nuevamente.",
      error: "NETWORK_ERROR",
    });
  }
});

// =========================
// HEALTH CHECK
// =========================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "EmpatIA backend",
    time: new Date().toISOString(),
  });
});

// =========================
// START
// =========================
app.listen(3001, () => {
  console.log("🚀 EmpatIA corriendo en puerto 3001");
});
