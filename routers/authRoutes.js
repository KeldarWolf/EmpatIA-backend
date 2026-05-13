import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      alert("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {

      console.log("📤 Enviando datos...");

      const response = await fetch(
        "https://empatia-backend.onrender.com/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: form.name,
            email: form.email,
            password: form.password,
          }),
        }
      );

      console.log("📡 STATUS:", response.status);

      const text = await response.text();
      console.log("📦 RAW RESPONSE:", text);

      let data = null;

      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("❌ No JSON válido:", text);
        alert("Error del servidor. Respuesta inválida.");
        return;
      }

      if (!response.ok) {
        console.log("❌ ERROR BACKEND:", data);
        alert(data.error || "Error al registrar usuario");
        return;
      }

      console.log("✅ USUARIO CREADO:", data);

      alert("Usuario registrado correctamente 🚀");

      navigate("/");

    } catch (error) {

      console.error("🔥 ERROR DE CONEXIÓN:", error);

      alert("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h1 style={styles.title}>Crear cuenta</h1>

        <p style={styles.subtitle}>Únete a EmpatIA</p>

        <form onSubmit={handleSubmit} style={styles.form}>

          <input
            type="text"
            name="name"
            placeholder="Nombre"
            value={form.name}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Correo"
            value={form.email}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <input
            type="password"
            name="confirm"
            placeholder="Confirmar contraseña"
            value={form.confirm}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>

        </form>

        <p style={styles.loginText}>
          ¿Ya tienes cuenta?{" "}
          <span
            style={styles.link}
            onClick={() => navigate("/")}
          >
            Iniciar sesión
          </span>
        </p>

      </div>
    </div>
  );
}

const styles = {

  container: {
    height: "100vh",
    background: "radial-gradient(circle at center, #050505, #000)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    background: "rgba(10, 10, 10, 0.9)",
    padding: "30px 20px",
    borderRadius: "20px",
    boxShadow: "0 0 40px rgba(0,229,255,0.15)",
    backdropFilter: "blur(8px)",
    width: "90%",
    maxWidth: "400px",
  },

  title: {
    color: "#00e5ff",
    textAlign: "center",
    marginBottom: "5px",
  },

  subtitle: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: "20px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#111",
    color: "#fff",
    outline: "none",
  },

  button: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#00e5ff",
    color: "#000",
    fontWeight: "bold",
  },

  loginText: {
    marginTop: "15px",
    color: "#aaa",
    textAlign: "center",
  },

  link: {
    color: "#00e5ff",
    cursor: "pointer",
  },
};
