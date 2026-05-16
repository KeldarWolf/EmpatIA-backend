// =====================================
// CHAT IA
// =====================================
app.post("/chat", async (req, res) => {

  const { message } = req.body;

  console.log("📩 MESSAGE:", message);

  // =====================================
  // VALIDACIÓN
  // =====================================
  if (!message?.trim()) {

    return res.json({
      ok: true,
      reply: "🤍 Cuéntame cómo te sientes.",
    });
  }

  try {

    // =====================================
    // PROMPT IA
    // =====================================
    const prompt = `
Eres EmpatIA.

Hablas como apoyo emocional.
Responde corto, humano y empático.
Usa respuestas breves.
Nunca expliques palabras como diccionario.

Si el usuario dice cosas como:
"mal", "triste", "vacío", "solo",
interpreta emoción y no significado.

Si detectas malestar:
invita actividades saludables.

Usuario: ${message}
`;

    // =====================================
    // REQUEST IA
    // =====================================
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
                  text: prompt,
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

    // =====================================
    // ERROR IA
    // =====================================
    if (!response.ok || !reply) {

      console.log("❌ IA ERROR:", data);

      return res.json({
        ok: false,

        error: true,

        messages: [
          "⚠️ Ocurrió un problema con la IA.",
          "🤍 Lo siento, ahora mismo no puedo entablar una conversación contigo.",
          "✨ ¿Quieres iniciar una actividad para sentirte mejor?",
        ],

        options: ["Sí", "No"],
      });
    }

    // =====================================
    // OK
    // =====================================
    return res.json({
      ok: true,
      reply,
      model: MODEL,
    });

  } catch (err) {

    console.log("❌ ERROR:", err.message);

    // =====================================
    // NETWORK ERROR
    // =====================================
    return res.json({
      ok: false,

      error: true,

      messages: [
        "⚠️ Error de conexión con la IA.",
        "🤍 Lo siento, en este momento no puedo conversar contigo.",
        "✨ ¿Quieres iniciar una actividad para sentirte mejor?",
      ],

      options: ["Sí", "No"],
    });
  }
});
