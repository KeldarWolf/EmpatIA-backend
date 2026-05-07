const db = require("../config/db");

const obtenerActividades = (callback) => {

    const sql = "SELECT * FROM Actividad";

    db.query(sql, callback);
};

module.exports = {
    obtenerActividades
};