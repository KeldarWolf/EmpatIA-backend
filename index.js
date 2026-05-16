import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

import authRoutes from "./routers/authRoutes.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

app.use("/api/auth", authRoutes);

// =========================
// CONFIG SEGURA SUPABASE
// =========================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("⚠️ SUPABASE NO CONFIGURADO");
}

// =========================
// CHAT
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: `EmpatIA: ${message}` }] }
        ],
      }),
    }
  );

  const data = await r.json();

  res.json({
    reply:
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "🤍 No respuesta",
  });
});

// =========================
// GUARDAR ACTIVIDAD (FIX REAL)
// =========================
app.post("/registro-actividad", async (req, res) => {
  try {
    if (!SUPABASE_URL) {
      return res.status(500).json({ error: "Supabase no configurado" });
    }

    const body = req.body;

    const r = await fetch(`${SUPABASE_URL}/rest/v1/registroactividad`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify([body]),
    });

    const data = await r.json();

    res.json(data?.[0] || { ok: true });
  } catch (e) {
    console.log("ERROR:", e);
    res.status(500).json({ error: "error guardar actividad" });
  }
});

// =========================
// GET ACTIVIDADES
// =========================
app.get("/mis-actividades/:id", async (req, res) => {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/registroactividad?id_usuario=eq.${req.params.id}&select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const data = await r.json();
    res.json(data || []);
  } catch {
    res.json([]);
  }
});

// =========================
// UPDATE GUSTO
// =========================
app.patch("/registro-actividad/:id", async (req, res) => {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/registroactividad?id_registro=eq.${req.params.id}`,
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      }
    );

    const data = await r.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: "update error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log("🚀 backend listo en puerto", PORT)
);
