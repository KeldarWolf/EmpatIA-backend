import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.post("/register", async (req, res) => {

    try {

        const { nombre, edad, email, password } = req.body;

        const result = await pool.query(
            `
            INSERT INTO Usuario
            (nombre, edad, email, password_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [
                nombre,
                edad || null,
                email,
                password
            ]
        );

        res.json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error creando usuario"
        });
    }
});

export default router;
