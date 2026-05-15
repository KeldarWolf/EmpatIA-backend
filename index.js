import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();
  const API = "https://empatia-backend.onrender.com/api/users";

  const [users, setUsers] = useState([]);
  const [section, setSection] = useState("dashboard");
  const [search, setSearch] = useState("");

  // =========================
  // AUTH
  // =========================
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== "admin") {
      navigate("/login");
    }
  }, []);

  // =========================
  // LOAD USERS
  // =========================
  const loadUsers = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // =========================
  // DELETE USER
  // =========================
  const deleteUser = async (id) => {
    if (!window.confirm("¿Eliminar usuario?")) return;

    await fetch(`${API}/${id}`, { method: "DELETE" });
    loadUsers();
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload();
  };

  // =========================
  // FILTER USERS
  // =========================
  const filteredUsers = users.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.title}>🛠 EMPATIA ADMIN PANEL</h1>

          <button style={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>

        {/* MENU */}
        <div style={styles.menu}>
          <button style={styles.menuBtn} onClick={() => setSection("dashboard")}>Dashboard</button>
          <button style={styles.menuBtn} onClick={() => setSection("users")}>Usuarios</button>
          <button style={styles.menuBtn} onClick={() => setSection("logs")}>Logs</button>
          <button style={styles.menuBtn} onClick={() => setSection("metrics")}>Métricas</button>
          <button style={styles.menuBtn} onClick={() => setSection("ai")}>IA</button>
          <button style={styles.menuBtn} onClick={() => setSection("reports")}>Reportes</button>
        </div>

        {/* =========================
            DASHBOARD
        ========================= */}
        {section === "dashboard" && (
          <div style={styles.statsGrid}>

            <div style={styles.statCard}>
              <h3>🟢 Servidor</h3>
              <p>Operativo</p>
            </div>

            <div style={styles.statCard}>
              <h3>👥 Usuarios</h3>
              <p>{users.length}</p>
            </div>

            <div style={styles.statCard}>
              <h3>🤖 IA</h3>
              <p>Activa</p>
            </div>

            <div style={styles.statCard}>
              <h3>📊 Sistema</h3>
              <p>Estable</p>
            </div>

          </div>
        )}

        {/* =========================
            USERS TABLE + SEARCH
        ========================= */}
        {section === "users" && (
          <div>

            <input
              style={styles.search}
              placeholder="🔎 Buscar usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div style={styles.table}>

              <div style={styles.tableHeader}>
                <span>Nombre</span>
                <span>Email</span>
                <span>Rol</span>
                <span>Acciones</span>
              </div>

              {filteredUsers.map((u) => (
                <div key={u.id_usuario} style={styles.tableRow}>

                  <span>{u.nombre}</span>
                  <span>{u.email}</span>
                  <span style={styles.role}>{u.role}</span>

                  <div style={styles.actions}>
                    <button style={styles.editBtn}>Editar</button>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => deleteUser(u.id_usuario)}
                    >
                      Eliminar
                    </button>
                  </div>

                </div>
              ))}

            </div>
          </div>
        )}

        {/* =========================
            LOGS
        ========================= */}
        {section === "logs" && (
          <div style={styles.logBox}>
            <h2 style={styles.sectionTitle}>📜 Logs del sistema</h2>

            <div style={styles.logLine}>[OK] Admin login</div>
            <div style={styles.logLine}>[AI] respuesta generada</div>
            <div style={styles.logLine}>[WARN] intento acceso denegado</div>
            <div style={styles.logLine}>[DB] usuario eliminado</div>
            <div style={styles.logLine}>[SEC] sesión validada</div>
          </div>
        )}

        {/* =========================
            METRICS
        ========================= */}
        {section === "metrics" && (
          <div style={styles.statsGrid}>

            <div style={styles.statCard}>
              <h3>CPU</h3>
              <p>29%</p>
            </div>

            <div style={styles.statCard}>
              <h3>RAM</h3>
              <p>60%</p>
            </div>

            <div style={styles.statCard}>
              <h3>API</h3>
              <p>1204 req</p>
            </div>

            <div style={styles.statCard}>
              <h3>IA Latency</h3>
              <p>1.2s</p>
            </div>

          </div>
        )}

        {/* =========================
            IA
        ========================= */}
        {section === "ai" && (
          <div style={styles.logBox}>
            <h2 style={styles.sectionTitle}>🤖 IA Status</h2>

            <div style={styles.logLine}>[OK] modelo conectado</div>
            <div style={styles.logLine}>[OK] IA emocional activa</div>
            <div style={styles.logLine}>[INFO] 90 conversaciones hoy</div>
          </div>
        )}

        {/* =========================
            REPORTS
        ========================= */}
        {section === "reports" && (
          <div style={styles.box}>
            <h2 style={styles.sectionTitle}>Reportes</h2>

            <button style={styles.button}>Exportar usuarios</button>
            <button style={styles.button}>Descargar PDF</button>
            <button style={styles.button}>Reporte IA</button>
            <button style={styles.button}>Auditoría sistema</button>
          </div>
        )}

        {/* FOOTER */}
        <button style={styles.backButton} onClick={logout}>
          Cerrar sesión
        </button>

      </div>
    </div>
  );
}

/* =========================
   STYLES CYBERPUNK
========================= */
const styles = {

  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #0b0f14, #05070a)",
    display: "flex",
    justifyContent: "center",
    padding: 20,
    fontFamily: "Arial",
  },

  container: {
    width: "100%",
    maxWidth: 1100,
    background: "rgba(15,22,32,0.9)",
    borderRadius: 20,
    padding: 20,
    border: "1px solid rgba(0,229,255,0.15)",
    boxShadow: "0 0 50px rgba(0,229,255,0.08)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  title: {
    color: "#00e5ff",
  },

  logoutBtn: {
    background: "#ff3b3b",
    border: "none",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 8,
  },

  menu: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 20,
  },

  menuBtn: {
    background: "rgba(0,229,255,0.12)",
    border: "1px solid rgba(0,229,255,0.25)",
    color: "#00e5ff",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },

  search: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    border: "1px solid rgba(0,229,255,0.3)",
    background: "#0b0f14",
    color: "#00e5ff",
  },

  table: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 3fr 1fr 2fr",
    padding: 10,
    background: "rgba(0,229,255,0.1)",
    color: "#00e5ff",
    fontWeight: "bold",
    borderRadius: 8,
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 3fr 1fr 2fr",
    padding: 10,
    background: "#111a24",
    borderRadius: 8,
    color: "#fff",
  },

  role: {
    color: "#00e5ff",
    textTransform: "uppercase",
  },

  actions: {
    display: "flex",
    gap: 10,
  },

  editBtn: {
    background: "#00e5ff",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
  },

  deleteBtn: {
    background: "#ff3b3b",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    color: "#fff",
  },

  logBox: {
    background: "#050a10",
    padding: 15,
    borderRadius: 12,
  },

  logLine: {
    fontFamily: "monospace",
    color: "#00e5ff",
    marginBottom: 6,
  },

  statCard: {
    background: "#0f1620",
    padding: 15,
    borderRadius: 12,
    color: "#fff",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    gap: 15,
  },

  box: {
    background: "#0f1620",
    padding: 15,
    borderRadius: 12,
  },

  sectionTitle: {
    color: "#00e5ff",
    marginBottom: 10,
  },

  button: {
    width: "100%",
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #00e5ff",
    background: "transparent",
    color: "#00e5ff",
    cursor: "pointer",
  },

  backButton: {
    width: "100%",
    marginTop: 15,
    padding: 10,
    borderRadius: 10,
    background: "#00e5ff",
    border: "none",
    fontWeight: "bold",
  },
};
