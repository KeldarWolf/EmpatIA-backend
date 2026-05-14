import express from "express";
import pool from "../config/db.js";
import bcrypt from "bcrypt";

const router = express.Router();


// ======================================================
// REGISTER
// ======================================================
router.post("/register", async (req, res) => {
  try {
    console.log("📩 REGISTER:", req.body);

    const { nombre, edad, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    // verificar usuario existente
    const existingUser = await pool.query(
      `SELECT id_usuario FROM usuario WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    console.log("🔐 Hasheando password...");

    const hash = await bcrypt.hash(password, 10);

    console.log("💾 Guardando usuario...");

    const result = await pool.query(
      `
      INSERT INTO usuario (nombre, edad, email, password_hash, role)
      VALUES ($1, $2, $3, $4, 'user')
      RETURNING id_usuario, nombre, email, role
      `,
      [nombre, edad || null, email, hash]
    );

    return res.json({
      ok: true,
      user: result.rows[0],
    });

  } catch (error) {
    console.error("❌ REGISTER ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});


// ======================================================
// LOGIN
// ======================================================
router.post("/login", async (req, res) => {
  try {
    console.log("📩 LOGIN:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const result = await pool.query(
      `SELECT * FROM usuario WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    console.log("🔐 Comparando password...");

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    console.log("✅ LOGIN EXITOSO");

    // 🔥 IMPORTANTE: esto es lo que usarás en React como usuario.nombre
    return res.json({
      ok: true,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
