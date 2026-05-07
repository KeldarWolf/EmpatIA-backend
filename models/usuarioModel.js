import db from "../config/db.js";

const crearUsuario = (usuario, callback) => {

    const sql = `
        INSERT INTO Usuario
        (nombre, edad, email, password_hash)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            usuario.nombre,
            usuario.edad,
            usuario.email,
            usuario.password_hash
        ],
        callback
    );
};

export default {
    crearUsuario
};