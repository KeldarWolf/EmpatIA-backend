import express from "express";
import pool from "../config/db.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { nombre, edad, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: "Faltan campos obligatorios",
      });
    }

    // 🔥 hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO "Usuario"
      (nombre, edad, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id_usuario, nombre, email, fecha_registro, activo
      `,
      [
        nombre,
        edad || null,
        email,
        passwordHash,
      ]
    );

    return res.json(result.rows[0]);

  } catch (error) {
    console.error("❌ ERROR REGISTER:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
