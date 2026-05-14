import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { styles } from "./Login.styles";
import LoginMatrix from "./LoginMatrix";

export default function Login() {

  const API = "https://empatia-backend.onrender.com/api/users";
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.nombre || !form.password) {
      alert("Completa usuario y contraseña");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://empatia-backend.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            nombre: form.nombre,
            password: form.password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Usuario o contraseña incorrectos");
        return;
      }

      // 💾 guardar sesión
      localStorage.setItem(
        "usuario",
        JSON.stringify(data.user)
      );

      alert(`Bienvenido ${data.user.nombre}`);

      // 🚪 redirección por rol
      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/user");
      }

    } catch (error) {
      console.error("❌ ERROR LOGIN:", error);
      alert("Error conectando con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <LoginMatrix />

      <div style={styles.centerBlock}>
        <div style={styles.card}>
          <h1 style={styles.title}>EmpatIA</h1>
          <p style={styles.subtitle}>
            IA emocional en tiempo real
          </p>

          <div style={styles.formBox}>
            <input
              placeholder="Nombre de usuario"
              value={form.nombre}
              onChange={(e) =>
                setForm({
                  ...form,
                  nombre: e.target.value
                })
              }
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value
                })
              }
              style={styles.input}
            />

            <button
              style={styles.primaryBtn}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>

            <button
              style={styles.secondaryBtn}
              onClick={() => navigate("/register")}
            >
              Registrarse
            </button>

            <div style={styles.divider}>o</div>

            <button style={styles.googleBtn}>
              🔵 Iniciar con Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
