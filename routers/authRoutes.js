import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { nombre, password } = req.body;

  const r = await pool.query(
    `SELECT id_usuario, nombre, email, role, password_hash
     FROM usuario
     WHERE nombre=$1 OR email=$1`,
    [nombre]
  );

  if (!r.rows.length)
    return res.status(401).json({ error: "no existe" });

  const user = r.rows[0];

  if (password !== user.password_hash)
    return res.status(401).json({ error: "password incorrecta" });

  res.json({
    ok: true,
    user: {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      email: user.email,
      role: user.role,
    },
  });
});

export default router;
