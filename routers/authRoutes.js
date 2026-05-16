import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {
  try {
    const { nombre, edad, email, password } = req.body;

    if (!nombre || !password) {
      return res.status(400).json({
        error: "Faltan datos",
      });
    }

    // verificar si existe
    const exist = await pool.query(
      `SELECT id_usuario
       FROM usuario
       WHERE nombre = $1 OR email = $2`,
      [nombre, email]
    );

    if (exist.rows.length > 0) {
      return res.status(400).json({
        error: "Usuario ya existe",
      });
    }

    // crear usuario
    const result = await pool.query(
      `INSERT INTO usuario
      (
        nombre,
        edad,
        email,
        password_hash,
        role
      )
      VALUES ($1, $2, $3, $4, 'user')

      RETURNING
      id_usuario,
      nombre,
      email,
      role`,
      [
        nombre,
        edad || null,
        email || null,
        password,
      ]
    );

    console.log("✅ REGISTER:", result.rows[0]);

    res.json({
      ok: true,

      user: {
        id_usuario: result.rows[0].id_usuario,
        nombre: result.rows[0].nombre,
        email: result.rows[0].email,
        role: result.rows[0].role,
      },
    });

  } catch (error) {
    console.error("❌ REGISTER ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { nombre, password } = req.body;

    if (!nombre || !password) {
      return res.status(400).json({
        error: "Faltan datos",
      });
    }

    const result = await pool.query(
      `SELECT
        id_usuario,
        nombre,
        email,
        role,
        password_hash

       FROM usuario

       WHERE nombre = $1
       OR email = $1`,
      [nombre]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Usuario no existe",
      });
    }

    const user = result.rows[0];

    console.log("👤 USER DB:", user);

    // validar password
    if (password !== user.password_hash) {
      return res.status(401).json({
        error: "Contraseña incorrecta",
      });
    }

    // 🔥 DEVOLVER ID_USUARIO CORRECTAMENTE
    const cleanUser = {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      email: user.email,
      role: (user.role || "user")
        .toLowerCase()
        .trim(),
    };

    console.log("✅ LOGIN OK:", cleanUser);

    res.json({
      ok: true,
      user: cleanUser,
    });

  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
