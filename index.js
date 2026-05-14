import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// LOG requests
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// HOME
app.get("/", (req, res) => {
  res.send("EmpatIA Backend activo 🚀");
});

// CHAT SIMPLE (IA en backend o proxy)
app.post("/chat", async (req, res) => {
  const { message } = req.body;

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

    const data = await r.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Te escucho 🤍";

    res.json({ reply });
  } catch (error) {
    console.error("CHAT ERROR:", error);
    res.status(500).json({ reply: "Error IA" });
  }
});

// PORT
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Backend en puerto", PORT);
});
