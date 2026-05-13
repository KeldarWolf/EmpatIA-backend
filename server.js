import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// rutas
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("EmpatIA backend OK 🚀");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
