import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css";

const API_USERS = "https://empatia-backend.onrender.com/api/users";
const API_LOGS = "https://empatia-backend.onrender.com/api/logs";

export default function Admin() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // =====================
  // LOAD USERS
  // =====================
  const loadUsers = async () => {
    try {
      const res = await fetch(API_USERS);
      const data = await res.json();

      setUsers(data || []);
      setFiltered(data || []);
    } catch (err) {
      console.error("Error users:", err);
    }
  };

  // =====================
  // LOAD LOGS IA
  // =====================
  const loadLogs = async () => {
    try {
      const res = await fetch(API_LOGS);
      if (!res.ok) return;

      const data = await res.json();
      setLogs(data || []);
    } catch (err) {
      console.log("Logs no disponibles");
    }
  };

  // =====================
  // INIT
  // =====================
  useEffect(() => {
    Promise.all([loadUsers(), loadLogs()]).then(() =>
      setLoading(false)
    );
  }, []);

  // =====================
  // SEARCH FILTER
  // =====================
  useEffect(() => {
    const q = search.toLowerCase();

    const result = users.filter((u) =>
      (u.nombre || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );

    setFiltered(result);
  }, [search, users]);

  // =====================
  // LOGOUT
  // =====================
  const logout = () => {
    localStorage.removeItem("admin");
    navigate("/");
  };

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>🧠 EmpatIA Admin</h2>

        <button onClick={() => navigate("/admin")}>
          📊 Dashboard
        </button>

        <button onClick={() => navigate("/usuarios")}>
          👤 Usuarios
        </button>

        <button onClick={() => navigate("/logs")}>
          🤖 Logs IA
        </button>

        <button onClick={() => navigate("/estadisticas")}>
          📈 Métricas
        </button>

        <button className="logout" onClick={logout}>
          Cerrar sesión
        </button>
      </aside>

      {/* MAIN */}
      <main className="main">

        <h1 className="title">
          🚀 Panel EmpatIA
        </h1>

        {/* SEARCH */}
        <input
          className="search"
          placeholder="🔎 Buscar usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* STATS */}
        <section className="stats">

          <div className="card">
            <h3>Usuarios</h3>
            <p>{users.length}</p>
          </div>

          <div className="card">
            <h3>Filtrados</h3>
            <p>{filtered.length}</p>
          </div>

          <div className="card danger">
            <h3>Logs IA</h3>
            <p>{logs.length}</p>
          </div>

        </section>

        {/* USERS TABLE */}
        <section className="panel">

          <h2>👤 Usuarios</h2>

          {loading ? (
            <p className="loading">Cargando sistema...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u, i) => (
                  <tr key={i}>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={u.activo ? "ok" : "off"}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* LOGS IA */}
        <section className="logs">

          <h2>🤖 Logs IA</h2>

          {logs.length === 0 ? (
            <p className="loading">Sin logs disponibles</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="log">
                <div className="tag">
                  {log.errorType || "OK"}
                </div>

                <p>{log.reply}</p>
              </div>
            ))
          )}
        </section>

      </main>
    </div>
  );
}



body {
  margin: 0;
  font-family: Arial;
  background: #0a0f1c;
  color: white;
}

.admin-layout {
  display: flex;
  height: 100vh;
}

/* SIDEBAR */
.sidebar {
  width: 240px;
  background: rgba(10, 15, 30, 0.95);
  padding: 20px;
  border-right: 1px solid #1f2a44;
}

.sidebar h2 {
  color: #00e5ff;
}

.sidebar button {
  width: 100%;
  margin: 8px 0;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #2a3b5c;
  background: transparent;
  color: white;
  cursor: pointer;
}

.sidebar button:hover {
  background: #00e5ff;
  color: black;
}

.logout {
  margin-top: 20px;
  border-color: red !important;
  color: red;
}

/* MAIN */
.main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.title {
  color: #00e5ff;
}

/* SEARCH */
.search {
  width: 100%;
  padding: 10px;
  background: #111a2e;
  border: none;
  color: white;
  border-radius: 8px;
}

/* STATS */
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 20px 0;
}

.card {
  background: rgba(20, 30, 60, 0.5);
  padding: 15px;
  border-radius: 12px;
}

.card p {
  color: #00e5ff;
  font-size: 22px;
}

/* TABLE */
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 10px;
  border-bottom: 1px solid #222;
}

.table tr:hover {
  background: rgba(0, 229, 255, 0.1);
}

.ok {
  color: #00ff99;
}

.off {
  color: #ff4d4d;
}

/* LOGS */
.logs {
  margin-top: 20px;
}

.log {
  padding: 10px;
  margin: 10px 0;
  border-left: 3px solid #00e5ff;
  background: rgba(20, 30, 60, 0.4);
}

.tag {
  color: #00e5ff;
  font-size: 12px;
}
