import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {
  try {
    console.log("🔥 REGISTER:", req.body);

    const { nombre, edad, email, password } = req.body;

    if (!nombre || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const exist = await pool.query(
      "SELECT id_usuario FROM usuario WHERE nombre = $1",
      [nombre]
    );

    if (exist.rows.length > 0) {
      return res.status(400).json({ error: "Usuario ya existe" });
    }

    const result = await pool.query(
      `
      INSERT INTO usuario (nombre, edad, email, password_hash, role)
      VALUES ($1, $2, $3, $4, 'user')
      RETURNING id_usuario, nombre, role
      `,
      [nombre, edad || null, email || null, password]
    );

    res.json({
      ok: true,
      user: result.rows[0],
    });

  } catch (error) {
    console.error("❌ REGISTER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});


/* =========================
   LOGIN (POR NOMBRE)
========================= */
router.post("/login", async (req, res) => {
  try {
    console.log("🔥 LOGIN:", req.body);

    const { nombre, password } = req.body;

    if (!nombre || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const result = await pool.query(
      "SELECT * FROM usuario WHERE nombre = $1",
      [nombre]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuario no existe" });
    }

    const user = result.rows[0];

    if (password !== user.password_hash) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    res.json({
      ok: true,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
