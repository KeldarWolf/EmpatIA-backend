import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routers/authRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("EmpatIA funcionando");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor puerto 3000");
});
