import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* GET USERS */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_usuario, nombre, email, role FROM usuario ORDER BY id_usuario"
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* UPDATE USER */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, role } = req.body;

    const result = await pool.query(
      `UPDATE usuario
       SET nombre = $1,
           email = $2,
           role = $3
       WHERE id_usuario = $4
       RETURNING id_usuario, nombre, email, role`,
      [nombre, email, role, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* DELETE USER */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM usuario WHERE id_usuario = $1",
      [id]
    );

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
