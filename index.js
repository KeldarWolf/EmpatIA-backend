import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";
import chatRoutes from "./routers/chatRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// logger
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("EmpatIA Backend activo 🚀");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Backend en puerto", PORT);
});
