import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// MEMORIA (SIN SUPABASE)
// =========================
let actividades = [];

// =========================
// CHAT IA
// =========================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: message }] }
          ],
        }),
      }
    );

    const data = await r.json();

    res.json({
      reply:
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "🤍 No puedo responder ahora",
    });
  } catch (e) {
    res.json({ reply: "🤍 error IA" });
  }
});

// =========================
// GUARDAR ACTIVIDAD
// =========================
app.post("/registro-actividad", (req, res) => {
  const nueva = {
    id_registro: Date.now(),
    ...req.body,
    creado_en: new Date(),
  };

  actividades.push(nueva);

  res.json(nueva);
});

// =========================
// OBTENER ACTIVIDADES
// =========================
app.get("/mis-actividades/:id", (req, res) => {
  const id = Number(req.params.id);

  const data = actividades.filter(
    (a) => Number(a.id_usuario) === id
  );

  res.json(data);
});

// =========================
// EDITAR GUSTO
// =========================
app.patch("/registro-actividad/:id", (req, res) => {
  const id = Number(req.params.id);

  actividades = actividades.map((a) =>
    a.id_registro === id
      ? { ...a, ...req.body }
      : a
  );

  res.json({ ok: true });
});

// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 backend estable en puerto", PORT);
});
