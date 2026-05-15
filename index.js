import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const API = "https://empatia-backend.onrender.com/api/users";
  const PING_API = "https://empatia-backend.onrender.com/";

  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [edit, setEdit] = useState(null);

  // UI
  const [section, setSection] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // IA STATUS REAL
  const [iaStatus, setIaStatus] = useState({
    ok: false,
    latency: 0,
  });

  // =========================
  // AUTH CHECK
  // =========================
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("usuario"));

    if (!session || session.role !== "admin") {
      navigate("/login");
    }
  }, []);

  // =========================
  // LOAD USERS
  // =========================
  const loadUsers = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // =========================
  // IA REAL PING (SIN TOKENS)
  // =========================
  const pingIA = async () => {
    try {
      const start = Date.now();

      const res = await fetch(PING_API);
      await res.text();

      const end = Date.now();

      setIaStatus({
        ok: res.ok,
        latency: end - start,
      });
    } catch {
      setIaStatus({
        ok: false,
        latency: 0,
      });
    }
  };

  useEffect(() => {
    pingIA();
    const interval = setInterval(pingIA, 10000);
    return () => clearInterval(interval);
  }, []);

  // =========================
  // CRUD
  // =========================
  const deleteUser = async (id) => {
    if (!window.confirm("¿Eliminar usuario?")) return;

    await fetch(`${API}/${id}`, { method: "DELETE" });
    loadUsers();
  };

  const saveUser = async () => {
    await fetch(`${API}/${edit.id_usuario}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    });

    setEdit(null);
    loadUsers();
  };

  // =========================
  // FILTER + SEARCH (MEMO)
  // =========================
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) =>
        roleFilter === "all" ? true : u.role === roleFilter
      )
      .filter((u) =>
        u.nombre.toLowerCase().includes(search.toLowerCase())
      );
  }, [users, search, roleFilter]);

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.title}>🛠 EMPATIA ADMIN</h1>

          <button style={styles.logoutBtn} onClick={logout}>
            Salir
          </button>
        </div>

        {/* MENU */}
        <div style={styles.menu}>
          {["dashboard", "users", "ia"].map((s) => (
            <button
              key={s}
              style={styles.menuBtn}
              onClick={() => setSection(s)}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ================= DASHBOARD ================= */}
        {section === "dashboard" && (
          <div style={styles.grid}>
            <div style={styles.cardStat}>
              👥 Usuarios <h2>{users.length}</h2>
            </div>

            <div style={styles.cardStat}>
              🤖 IA Status
              <h2 style={{ color: iaStatus.ok ? "#00ffcc" : "red" }}>
                {iaStatus.ok ? "ONLINE" : "OFFLINE"}
              </h2>
            </div>

            <div style={styles.cardStat}>
              ⚡ Latencia IA
              <h2>{iaStatus.latency} ms</h2>
            </div>
          </div>
        )}

        {/* ================= USERS ================= */}
        {section === "users" && (
          <>
            {/* filtros */}
            <div style={styles.filters}>
              <input
                style={styles.input}
                placeholder="🔎 Buscar usuario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                style={styles.input}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* TABLA */}
            <div style={styles.table}>
              <div style={styles.rowHead}>
                <span>Nombre</span>
                <span>Email</span>
                <span>Rol</span>
                <span>Acciones</span>
              </div>

              {filteredUsers.map((u) => (
                <div key={u.id_usuario} style={styles.row}>
                  <span>{u.nombre}</span>
                  <span>{u.email}</span>
                  <span style={styles.role}>{u.role}</span>

                  <div style={styles.actions}>
                    <button
                      style={styles.btnEdit}
                      onClick={() => setEdit(u)}
                    >
                      Editar
                    </button>

                    <button
                      style={styles.btnDelete}
                      onClick={() => deleteUser(u.id_usuario)}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ================= IA ================= */}
        {section === "ia" && (
          <div style={styles.iaBox}>
            <h2>🤖 Estado IA REAL</h2>

            <p>
              Estado:{" "}
              <b style={{ color: iaStatus.ok ? "#00ffcc" : "red" }}>
                {iaStatus.ok ? "Conectada" : "Sin conexión"}
              </b>
            </p>

            <p>Ping backend: {iaStatus.latency} ms</p>

            <p style={{ opacity: 0.7 }}>
              (esto no gasta tokens, solo revisa si el servidor responde)
            </p>

            <button style={styles.menuBtn} onClick={pingIA}>
              Re-chequear IA
            </button>
          </div>
        )}

        {/* ================= EDIT MODAL ================= */}
        {edit && (
          <div style={styles.modal}>
            <div style={styles.modalBox}>
              <input
                style={styles.input}
                value={edit.nombre}
                onChange={(e) =>
                  setEdit({ ...edit, nombre: e.target.value })
                }
              />

              <input
                style={styles.input}
                value={edit.email || ""}
                onChange={(e) =>
                  setEdit({ ...edit, email: e.target.value })
                }
              />

              <select
                style={styles.input}
                value={edit.role}
                onChange={(e) =>
                  setEdit({ ...edit, role: e.target.value })
                }
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>

              <div style={styles.actions}>
                <button style={styles.btnEdit} onClick={saveUser}>
                  Guardar
                </button>
                <button
                  style={styles.btnDelete}
                  onClick={() => setEdit(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= STYLE EMPATIA ================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#05070a",
    color: "#fff",
    padding: 20,
    fontFamily: "Arial",
  },

  container: {
    maxWidth: 1200,
    margin: "auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    color: "#00e5ff",
  },

  logoutBtn: {
    background: "red",
    border: "none",
    padding: 10,
    color: "#fff",
    borderRadius: 8,
  },

  menu: {
    display: "flex",
    gap: 10,
    marginTop: 15,
  },

  menuBtn: {
    background: "#111",
    border: "1px solid #00e5ff",
    color: "#00e5ff",
    padding: 10,
    borderRadius: 8,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 15,
    marginTop: 20,
  },

  cardStat: {
    background: "#111",
    padding: 20,
    borderRadius: 10,
    border: "1px solid #00e5ff33",
  },

  filters: {
    display: "flex",
    gap: 10,
    marginTop: 20,
  },

  input: {
    padding: 10,
    background: "#111",
    border: "1px solid #00e5ff33",
    color: "#fff",
    borderRadius: 8,
    width: "100%",
  },

  table: {
    marginTop: 20,
  },

  rowHead: {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1fr 1fr",
    padding: 10,
    background: "#111",
    fontWeight: "bold",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1fr 1fr",
    padding: 10,
    borderBottom: "1px solid #222",
  },

  role: {
    color: "#00e5ff",
  },

  actions: {
    display: "flex",
    gap: 5,
  },

  btnEdit: {
    background: "#00e5ff",
    border: "none",
    padding: 6,
    borderRadius: 6,
  },

  btnDelete: {
    background: "red",
    border: "none",
    color: "#fff",
    padding: 6,
    borderRadius: 6,
  },

  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    background: "#111",
    padding: 20,
    borderRadius: 10,
    width: 350,
  },

  iaBox: {
    marginTop: 20,
    background: "#111",
    padding: 20,
    borderRadius: 10,
  },
};
