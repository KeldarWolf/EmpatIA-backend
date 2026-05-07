const interaccionModel = require("../models/interaccionModel");

const enviarMensaje = (req, res) => {

    const { id_usuario, mensaje } = req.body;

    let emocion = "Neutral";

    if (mensaje.includes("triste")) {
        emocion = "Tristeza";
    }

    const respuestaIA = "Entiendo cómo te sientes.";

    interaccionModel.guardarInteraccion(
        {
            id_usuario,
            mensaje_usuario: mensaje,
            respuesta_sistema: respuestaIA,
            emocion_detectada: emocion
        },
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                respuesta: respuestaIA,
                emocion
            });
        }
    );
};

module.exports = {
    enviarMensaje
};