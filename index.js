import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://empatia-backend.onrender.com";

// =========================
// 6 OPCIONES PRINCIPALES
// =========================
const mainOptions = [
  "🎵 Música",
  "🧘 Relajación",
  "🏃 Actividad física",
  "🤍 Hablar un poco",
  "⚙️ Cambiar preguntas fáciles",
  "❓ No sé qué hacer",
];

// =========================
// SUB MENÚS
// =========================
const subOptions = {
  musica: [
    "Lo-fi",
    "Piano suave",
    "Jazz relajante",
    "Música feliz",
    "Sonidos naturaleza",
  ],
  relajacion: [
    "Respirar profundo",
    "Meditar",
    "Cerrar ojos",
    "Tomar agua",
    "Relajar cuerpo",
  ],
  fisico: [
    "Caminar",
    "Estiramientos",
    "Yoga",
    "Bailar",
    "Mover cuerpo",
  ],
};

export default function User() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("usuario") || "null");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState("main"); 
  const [category, setCategory] = useState(null);

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    setMessages([
      { role: "ai", text: `Hola ${user?.nombre || "🤍"}, estoy contigo.` },
      { role: "ai", text: "Elige una opción:" },
      { role: "ai", options: mainOptions },
    ]);
  }, []);

  // =========================
  // IA CALL
  // =========================
  const askAI = async (message) => {
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      return await res.json();
    } catch {
      return null;
    }
  };

  // =========================
  // GUARDAR EN SUPABASE
  // =========================
  const saveActivity = async (text, idActividad = null) => {
    if (!user?.id_usuario) return;

    await fetch(`${API}/registro-actividad`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_usuario: user.id_usuario,
        id_actividad: idActividad,
        puntaje_agrado: 6,
        frecuencia_deseada: "media",
        reaccion: text,
      }),
    });
  };

  // =========================
  // CLICK OPCIONES
  // =========================
  const handleOption = async (opt) => {
    setMessages((prev) => [...prev, { role: "user", text: opt }]);

    // =========================
    // OPCIONES PRINCIPALES
    // =========================
    if (opt === "🎵 Música") {
      setMode("sub");
      setCategory("musica");

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Elige música:" },
        { role: "ai", options: subOptions.musica },
      ]);
      return;
    }

    if (opt === "🧘 Relajación") {
      setMode("sub");
      setCategory("relajacion");

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Elige relajación:" },
        { role: "ai", options: subOptions.relajacion },
      ]);
      return;
    }

    if (opt === "🏃 Actividad física") {
      setMode("sub");
      setCategory("fisico");

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Elige actividad física:" },
        { role: "ai", options: subOptions.fisico },
      ]);
      return;
    }

    // =========================
    // CAMBIAR PREGUNTAS
    // =========================
    if (opt === "⚙️ Cambiar preguntas fáciles") {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "🔄 Reiniciando preguntas..." },
        { role: "ai", options: mainOptions },
      ]);

      setMode("main");
      setCategory(null);
      return;
    }

    // =========================
    // NO SÉ
    // =========================
    if (opt === "❓ No sé qué hacer") {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Te ayudo 🤍 prueba esto:",
          options: mainOptions,
        },
      ]);
      return;
    }

    // =========================
    // HABLAR
    // =========================
    if (opt === "🤍 Hablar un poco") {
      const response = await askAI("habla conmigo");

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: response?.reply || "Estoy contigo 🤍" },
      ]);

      await saveActivity("hablar");
      return;
    }

    // =========================
    // SUB OPCIONES (guardar actividad)
    // =========================
    setMessages((prev) => [
      ...prev,
      { role: "ai", text: `✔ Actividad seleccionada: ${opt}` },
    ]);

    await saveActivity(opt);

    setTimeout(() => navigate("/actividades"), 1000);
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 20, background: "#0b0f14", color: "white" }}>

      <h2>🤍 EmpatIA User</h2>

      <div style={{ marginBottom: 20 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "8px 0" }}>
            {m.role === "ai" ? "🤖 " : "👤 "}
            {m.text}

            {m.options && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {m.options.map((opt, j) => (
                  <button
                    key={j}
                    onClick={() => handleOption(opt)}
                    style={{
                      padding: 8,
                      background: "#1f2937",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      marginTop: 5,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={() => navigate("/actividades")}>
        🎯 Ir a actividades
      </button>

    </div>
  );
}
