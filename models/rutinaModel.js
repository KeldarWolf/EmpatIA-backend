const db = require("../config/db");

const crearRutina = (rutina, callback) => {

    const sql = `
        INSERT INTO RutinaPersonalizada
        (id_usuario, nombre, descripcion, frecuencia, fecha_creacion)
        VALUES (?, ?, ?, ?, NOW())
    `;

    db.query(
        sql,
        [
            rutina.id_usuario,
            rutina.nombre,
            rutina.descripcion,
            rutina.frecuencia
        ],
        callback
    );
};

module.exports = {
    crearRutina
};