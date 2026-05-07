const db = require("../config/db");

const guardarInteraccion = (datos, callback) => {

    const sql = `
        INSERT INTO Interaccion
        (id_usuario, fecha_hora, mensaje_usuario, respuesta_sistema, emocion_detectada)
        VALUES (?, NOW(), ?, ?, ?)
    `;

    db.query(
        sql,
        [
            datos.id_usuario,
            datos.mensaje_usuario,
            datos.respuesta_sistema,
            datos.emocion_detectada
        ],
        callback
    );
};

module.exports = {
    guardarInteraccion
};