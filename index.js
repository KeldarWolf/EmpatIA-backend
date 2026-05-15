import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./user.css";

import ChatBox from "./ChatBox";
import InputBox from "./InputBox";
import frases from "./frases";

const API_URL = "https://empatia-backend.onrender.com";

// =========================
// ACTIVIDADES
// =========================
const actividades = [
  {
    nombre: "🎵 Música",
    prompt: "Recomienda una actividad musical relajante y explica cómo hacerla paso a paso.",
  },
  {
    nombre: "🧘 Relajación",
    prompt: "Explica una actividad simple de relajación guiada para alguien con ansiedad.",
  },
  {
    nombre: "🚶 Ejercicio ligero",
    prompt: "Explica un ejercicio suave y fácil para mejorar el ánimo.",
  },
  {
    nombre: "📖 Lectura",
    prompt: "Recomienda una actividad de lectura tranquila y cómo disfrutarla.",
  },
  {
    nombre: "🎨 Creatividad",
    prompt: "Explica una actividad creativa relajante y entretenida.",
  },
];

export default function User() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityResponse, setActivityResponse] = useState([]);
  const [loading, setLoading] = useState(false);

  const [gusto, setGusto] = useState(5);
  const [savedActivities, setSavedActivities] = useState([]);

  const [frase, setFrase] = useState("");

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    const random = frases[Math.floor(Math.random() * frases.length)];
    setFrase(random);

    const user = localStorage.getItem("nombre") || "Usuario";

    setMessages([
      { sender: "bot", text: `Hola ${user} 💙 estoy aquí contigo` },
      { sender: "bot", text: "Cuéntame cómo te sientes..." },
    ]);
  }, []);

  // =========================
  // CHAT IA
  // =========================
  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    const userInput = input;
    setInput("");

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: data.reply || "Estoy aquí contigo 💙" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠ Error al conectar con EmpatIA" },
      ]);
    }
  };

  // =========================
  // ABRIR ACTIVIDAD (BD + IA)
  // =========================
  const openActivity = async (activity) => {
    setSelectedActivity(activity);
    setActivityResponse([]);
    setLoading(true);

    try {
      const resBD = await fetch(
        `${API_URL}/actividades?nombre=eq.${activity.nombre.replace(/🎵|🧘|🚶|📖|🎨/g, "").trim()}`
      );

      const bd = await resBD.json();
      const instruccion = bd?.[0]?.instrucciones;

      if (instruccion) {
        setActivityResponse(instruccion.split(". "));
      } else {
        const res = await fetch(`${API_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: activity.prompt }),
        });

        const data = await res.json();
        setActivityResponse((data.reply || "").split("\n"));
      }
    } catch {
      setActivityResponse(["⚠ Error cargando actividad"]);
    }

    setLoading(false);
  };

  // =========================
  // GUARDAR ACTIVIDAD EN BD
  // =========================
  const guardarActividad = async () => {
    if (!selectedActivity) return;

    const user = JSON.parse(localStorage.getItem("usuario"));

    const payload = {
      id_usuario: user?.id_usuario,
      nombre_actividad: selectedActivity.nombre,
      puntaje_agrado: Number(gusto),
      frecuencia_deseada: "media",
      reaccion: "positiva",
    };

    try {
      await fetch(`${API_URL}/registro-actividad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSavedActivities((prev) => [
        { nombre: selectedActivity.nombre, gusto, fecha: new Date() },
        ...prev,
      ]);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="user-container">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>🎯 Actividades</h2>

        {actividades.map((act, i) => (
          <button
            key={i}
            className="activity-btn"
            onClick={() => openActivity(act)}
          >
            {act.nombre}
          </button>
        ))}

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
        >
          ⬅ Salir
        </button>
      </div>

      {/* MAIN */}
      <div className="main-content">

        {/* FRASE */}
        <div className="frase-box">✨ {frase}</div>

        {/* CHAT */}
        <div className="chat-section">
          <h2>💬 Acompañamiento</h2>

          <ChatBox messages={messages} />

          <InputBox
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
          />
        </div>

        {/* ACTIVIDAD ABIERTA */}
        {selectedActivity && (
          <div className="activity-box">

            <h2>🧠 {selectedActivity.nombre}</h2>

            {loading && <p>🤖 Cargando...</p>}

            {!loading && (
              <>
                <div className="ia-response">
                  {activityResponse.map((msg, i) => (
                    <p key={i}>{msg}</p>
                  ))}
                </div>

                {/* =========================
                    GUSTO BAR
                ========================== */}
                <div className="gusto-box">

                  <p style={{ fontSize: 12 }}>
                    ⭐ Gusto: {gusto}/10
                  </p>

                  <div style={{ display: "flex", gap: 4 }}>
                    {Array.from({ length: 10 }, (_, i) => {
                      const val = i + 1;

                      return (
                        <div
                          key={i}
                          onClick={() => setGusto(val)}
                          style={{
                            width: 18,
                            height: 8,
                            background:
                              val <= gusto ? "#22c55e" : "#374151",
                            cursor: "pointer",
                            borderRadius: 3,
                          }}
                        />
                      );
                    })}
                  </div>

                  <button
                    className="save-btn"
                    onClick={guardarActividad}
                  >
                    💾 Guardar actividad
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* GUARDADAS */}
        <div className="saved-box">
          <h2>📌 Actividades guardadas</h2>

          {savedActivities.length === 0 && (
            <p>No tienes actividades aún</p>
          )}

          {savedActivities.map((a, i) => (
            <div key={i} className="saved-card">
              <h3>{a.nombre}</h3>

              <p>⭐ Gusto: {a.gusto}/10</p>

              <p>
                📅 {new Date(a.fecha).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
