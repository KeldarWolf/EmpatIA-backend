import express from "express";
import pool from "../config/db.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/register", async (req, res) => {

  try {

    console.log("📩 BODY:", req.body);

    const { nombre, edad, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    console.log("🔐 Hasheando password...");

    const hash = await bcrypt.hash(password, 10);

    console.log("💾 INSERT BD...");

    const result = await pool.query(
      `INSERT INTO "Usuario" (nombre, edad, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id_usuario, nombre, email`,
      [nombre, edad || null, email, hash]
    );

    console.log("✅ GUARDADO:", result.rows[0]);

    return res.json({
      ok: true,
      user: result.rows[0]
    });

  } catch (error) {

    console.error("❌ ERROR DB COMPLETO:", error);

    return res.status(500).json({
      error: error.message
    });
  }
});

export default router;
