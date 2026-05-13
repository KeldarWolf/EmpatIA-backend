import express from "express";
import pool from "../config/db.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/register", async (req, res) => {
  console.log("📩 REGISTER HIT");
  console.log("BODY:", req.body);

  try {
    const { nombre, edad, email, password } = req.body;

    console.log("🔎 Validando datos...");

    if (!nombre || !email || !password) {
      console.log("❌ Faltan campos");
      return res.status(400).json({
        error: "Faltan campos obligatorios",
      });
    }

    console.log("🔐 Hasheando password...");
    const passwordHash = await bcrypt.hash(password, 10);

    console.log("💾 Insertando en DB...");

    const result = await pool.query(
      `
      INSERT INTO "Usuario"
      (nombre, edad, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id_usuario, nombre, email
      `,
      [nombre, edad || null, email, passwordHash]
    );

    console.log("✅ Usuario creado:", result.rows[0]);

    return res.json({
      ok: true,
      user: result.rows[0],
    });

  } catch (error) {
    console.log("🔥 ERROR EN REGISTER:");
    console.error(error);

    return res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
