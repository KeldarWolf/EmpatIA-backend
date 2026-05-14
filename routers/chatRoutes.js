import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("🤖 CHAT:", req.body);

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Falta message" });
    }

    const reply = `🤍 Entiendo lo que dices: "${message}"`;

    return res.json({ reply });

  } catch (error) {
    console.error("CHAT ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
