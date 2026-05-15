import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* =========================
   SYSTEM STATUS REAL
========================= */
router.get("/status", async (req, res) => {
  try {
    // usuarios reales en BD
    const users = await pool.query(
      "SELECT COUNT(*) FROM usuario"
    );

    res.json({
      ai: process.env.GEMINI_API_KEY ? "online" : "offline",
      db: "online",
      users: parseInt(users.rows[0].count),
      tokens: process.env.GEMINI_API_KEY ? "ok" : "missing",
      uptime: process.uptime(),
    });

  } catch (error) {
    res.status(500).json({
      ai: "unknown",
      db: "offline",
      error: error.message,
    });
  }
});

export default router;
