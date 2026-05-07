import bcrypt from "bcrypt";

import usuarioModel from "../models/usuarioModel.js";

const registro = async (req, res) => {

    try {

        const { nombre, edad, email, password } = req.body;

        const password_hash = await bcrypt.hash(password, 10);

        usuarioModel.crearUsuario(
            {
                nombre,
                edad,
                email,
                password_hash
            },
            (err, result) => {

                if (err) {
                    return res.status(500).json(err);
                }

                res.json({
                    mensaje: "Usuario registrado"
                });
            }
        );

    } catch (error) {

        res.status(500).json(error);

    }
};

export default {
    registro
};