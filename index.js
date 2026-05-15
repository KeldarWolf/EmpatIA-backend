import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const API = "https://empatia-backend.onrender.com/api/users";
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [edit, setEdit] = useState(null);
  const [section, setSection] = useState("dashboard");

  // 🔎 SEARCH STATE
  const [search, setSearch] = useState("");

  // =========================
  // SECURITY CHECK
  // =========================
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("usuario"));

    if (!session || session.role !== "admin") {
      navigate("/");
    }
  }, []);

  // =========================
  // LOAD USERS
  // =========================
  const loadUsers = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // =========================
  // DELETE USER
  // =========================
  const deleteUser = async (id) => {
    if (!confirm("¿Eliminar usuario?")) return;

    await fetch(`${API}/${id}`, { method: "DELETE" });
    loadUsers();
  };

  // =========================
  // UPDATE USER
  // =========================
  const saveUser = async () => {
    await fetch(`${API}/${edit.id_usuario}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: edit.nombre,
        email: edit.email,
        role: edit.role,
      }),
    });

    setEdit(null);
    loadUsers();
  };

  // =========================
  // FILTER USERS
  // =========================
  const filteredUsers = users.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase())
  );

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.title}>🛠 EMPATIA ADMIN</h1>

          <button style={styles.logoutBtn} onClick={logout}>
            Cerrar sesión
          </button>
        </div>

        {/* MENU */}
        <div style={styles.menu}>
          {["dashboard", "users", "logs", "metrics", "ai", "reports"].map((s) => (
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
            <div style={styles.cardBox}>Servidor: OK</div>
            <div style={styles.cardBox}>Usuarios: {users.length}</div>
            <div style={styles.cardBox}>IA: Activa</div>
          </div>
        )}

        {/* ================= USERS ================= */}
        {section === "users" && (
          <div>

            {/* 🔎 SEARCH */}
            <input
              style={styles.search}
              placeholder="Buscar usuario por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* TABLE */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id_usuario}>
                      <td>{u.id_usuario}</td>
                      <td>{u.nombre}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>
                        <button
                          style={styles.editBtn}
                          onClick={() => setEdit(u)}
                        >
                          Editar
                        </button>

                        <button
                          style={styles.deleteBtn}
                          onClick={() => deleteUser(u.id_usuario)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= IA STATUS REAL ================= */}
        {section === "ai" && (
          <div style={styles.cardBox}>
            <h2>🤖 Estado IA REAL</h2>

            <button
              style={styles.pingBtn}
              onClick={async () => {
                const res = await fetch(
                  "https://empatia-backend.onrender.com/chat",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: "ping" }),
                  }
                );

                const data = await res.json();
                alert("IA activa: " + data.reply);
              }}
            >
              Test IA (Ping real)
            </button>

            <p style={{ color: "#aaa", marginTop: 10 }}>
              ✔ Si responde = IA funcionando en servidor
            </p>
          </div>
        )}

        {/* ================= MODAL EDIT ================= */}
        {edit && (
          <div style={styles.modal}>
            <div style={styles.modalBox}>
              <input
                value={edit.nombre}
                onChange={(e) =>
                  setEdit({ ...edit, nombre: e.target.value })
                }
                style={styles.input}
              />

              <input
                value={edit.email || ""}
                onChange={(e) =>
                  setEdit({ ...edit, email: e.target.value })
                }
                style={styles.input}
              />

              <select
                value={edit.role}
                onChange={(e) =>
                  setEdit({ ...edit, role: e.target.value })
                }
                style={styles.input}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>

              <div style={styles.row}>
                <button style={styles.saveBtn} onClick={saveUser}>
                  Guardar
                </button>

                <button style={styles.cancelBtn} onClick={() => setEdit(null)}>
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

/* =========================
   STYLES UX MEJORADO
========================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#05070a",
    display: "flex",
    justifyContent: "center",
    padding: 20,
    fontFamily: "Arial",
    color: "#fff",
  },

  container: {
    width: "100%",
    maxWidth: 1100,
    background: "#0b0f14",
    borderRadius: 16,
    padding: 20,
    border: "1px solid #00e5ff33",
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
    background: "#ff3b3b",
    border: "none",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 8,
  },

  menu: {
    display: "flex",
    gap: 10,
    marginTop: 15,
    flexWrap: "wrap",
  },

  menuBtn: {
    background: "#111",
    color: "#00e5ff",
    border: "1px solid #00e5ff33",
    padding: "8px 10px",
    borderRadius: 8,
    cursor: "pointer",
  },

  search: {
    width: "100%",
    marginTop: 15,
    marginBottom: 10,
    padding: 10,
    background: "#111",
    border: "1px solid #00e5ff33",
    color: "#fff",
    borderRadius: 8,
  },

  tableContainer: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#0f141b",
    color: "#fff",
  },

  editBtn: {
    background: "#00e5ff",
    border: "none",
    padding: "5px 8px",
    marginRight: 5,
    borderRadius: 5,
    cursor: "pointer",
  },

  deleteBtn: {
    background: "#ff3b3b",
    border: "none",
    padding: "5px 8px",
    borderRadius: 5,
    cursor: "pointer",
    color: "#fff",
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
    background: "#0b0f14",
    padding: 20,
    borderRadius: 10,
    width: 320,
    border: "1px solid #00e5ff33",
  },

  input: {
    width: "100%",
    marginTop: 10,
    padding: 8,
    background: "#111",
    color: "#fff",
    border: "1px solid #00e5ff33",
  },

  row: {
    display: "flex",
    gap: 10,
    marginTop: 10,
  },

  saveBtn: {
    flex: 1,
    background: "#00e5ff",
    border: "none",
    padding: 8,
  },

  cancelBtn: {
    flex: 1,
    background: "#333",
    color: "#fff",
    border: "none",
  },

  cardBox: {
    background: "#111",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 10,
    marginTop: 20,
  },

  pingBtn: {
    marginTop: 10,
    padding: 10,
    background: "#00e5ff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};
