import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 👇 LOG GLOBAL (ver todo lo que entra)
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  console.log("🏠 Home hit");
  res.send("EmpatIA funcionando 🚀");
});

app.get("/debug", (req, res) => {
  console.log("🧪 Debug endpoint hit");
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
