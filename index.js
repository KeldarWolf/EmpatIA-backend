import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

export default function Admin() {

  const USERS_API =
    "https://empatia-backend.onrender.com/api/users";

  const AI_API =
    "https://empatia-backend.onrender.com/api/ai-status";

  const SYSTEM_API =
    "https://empatia-backend.onrender.com/api/system-status";

  const navigate =
    useNavigate();

  // =========================
  // STATES
  // =========================
  const [users, setUsers] =
    useState([]);

  const [edit, setEdit] =
    useState(null);

  const [view, setView] =
    useState("dashboard");

  const [logs, setLogs] =
    useState([]);

  const [aiStatus,
    setAiStatus] =
    useState({
      online: false,
      token: false,
      model: "Cargando...",
      message: "",
    });

  const [system,
    setSystem] =
    useState({
      server: "Cargando...",
      ram: "0 MB",
      uptime: "0",
      database: false,
    });

  // =========================
  // SECURITY
  // =========================
  useEffect(() => {

    try {

      const savedUser =
        localStorage.getItem(
          "user"
        );

      if (!savedUser) {
        navigate("/login");
        return;
      }

      const user =
        JSON.parse(savedUser);

      if (
        user.role !== "admin"
      ) {
        navigate("/login");
      }

    } catch (err) {

      localStorage.clear();

      navigate("/login");
    }

  }, []);

  // =========================
  // LOGS
  // =========================
  const addLog = (text) => {

    const now =
      new Date().toLocaleTimeString();

    setLogs((prev) => [
      `${now} - ${text}`,
      ...prev,
    ]);
  };

  // =========================
  // USERS
  // =========================
  const loadUsers =
    async () => {

      try {

        const res =
          await fetch(
            USERS_API
          );

        const data =
          await res.json();

        if (
          Array.isArray(data)
        ) {

          setUsers(data);

          addLog(
            "Usuarios cargados"
          );

        }

      } catch (err) {

        console.error(err);

        addLog(
          "Error usuarios"
        );

      }

    };

  // =========================
  // AI STATUS
  // =========================
  const loadAIStatus =
    async () => {

      try {

        const res =
          await fetch(
            AI_API
          );

        const data =
          await res.json();

        setAiStatus(data);

        addLog(
          "IA verificada"
        );

      } catch (err) {

        console.error(err);

        setAiStatus({
          online: false,
          token: false,
          model: "Error",
          message:
            "Sin conexión",
        });

        addLog(
          "Error IA"
        );

      }

    };

  // =========================
  // SYSTEM STATUS
  // =========================
  const loadSystem =
    async () => {

      try {

        const res =
          await fetch(
            SYSTEM_API
          );

        const data =
          await res.json();

        setSystem(data);

        addLog(
          "Sistema verificado"
        );

      } catch (err) {

        console.error(err);

        addLog(
          "Error sistema"
        );

      }

    };

  // =========================
  // INIT
  // =========================
  useEffect(() => {

    loadUsers();

    loadAIStatus();

    loadSystem();

    const interval =
      setInterval(() => {

        loadAIStatus();

        loadSystem();

      }, 10000);

    return () =>
      clearInterval(
        interval
      );

  }, []);

  // =========================
  // DELETE USER
  // =========================
  const deleteUser =
    async (id) => {

      const ok =
        window.confirm(
          "¿Eliminar usuario?"
        );

      if (!ok) return;

      try {

        await fetch(
          `${USERS_API}/${id}`,
          {
            method:
              "DELETE",
          }
        );

        addLog(
          `Usuario eliminado ${id}`
        );

        loadUsers();

      } catch (err) {

        console.error(err);

      }

    };

  // =========================
  // SAVE USER
  // =========================
  const saveUser =
    async () => {

      try {

        await fetch(
          `${USERS_API}/${edit.id_usuario}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nombre:
                  edit.nombre,

                email:
                  edit.email,

                role:
                  edit.role,
              }),
          }
        );

        addLog(
          `Usuario editado ${edit.nombre}`
        );

        setEdit(null);

        loadUsers();

      } catch (err) {

        console.error(err);

      }

    };

  // =========================
  // EXPORT
  // =========================
  const exportUsers = () => {

    const blob =
      new Blob(
        [
          JSON.stringify(
            users,
            null,
            2
          ),
        ],
        {
          type:
            "application/json",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    a.href = url;

    a.download =
      "usuarios.json";

    a.click();

    addLog(
      "Reporte exportado"
    );

  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {

    localStorage.clear();

    navigate("/login", {
      replace: true,
    });

    window.location.reload();

  };

  return (
    <div style={styles.container}>

      {/* =========================
          DASHBOARD
      ========================= */}
      {view ===
        "dashboard" && (
        <div style={styles.card}>

          <div
            style={
              styles.topBar
            }
          >

            <h1
              style={
                styles.title
              }
            >
              🛠 EMPATIA ADMIN
            </h1>

            <button
              style={
                styles.logoutBtn
              }
              onClick={
                logout
              }
            >
              Salir
            </button>

          </div>

          <p
            style={
              styles.subtitle
            }
          >
            Supervisión del
            sistema
          </p>

          {/* =========================
              SYSTEM
          ========================= */}
          <div style={styles.box}>

            <h3
              style={
                styles.sectionTitle
              }
            >
              Estado sistema
            </h3>

            <p>
              🟢 Servidor:
              {
                system.server
              }
            </p>

            <p>
              💾 RAM:
              {system.ram}
            </p>

            <p>
              ⏱ Uptime:
              {
                system.uptime
              }
            </p>

            <p>
              🗄 Base datos:
              {system.database
                ? " Conectada"
                : " Error"}
            </p>

          </div>

          {/* =========================
              AI
          ========================= */}
          <div style={styles.box}>

            <h3
              style={
                styles.sectionTitle
              }
            >
              Estado IA
            </h3>

            <p>
              🤖 Modelo:
              {
                aiStatus.model
              }
            </p>

            <p>
              ⚡ Estado:
              {aiStatus.online
                ? " Online"
                : " Offline"}
            </p>

            <p>
              🔑 API KEY:
              {aiStatus.token
                ? " Detectada"
                : " No detectada"}
            </p>

            <p>
              💬 {
                aiStatus.message
              }
            </p>

          </div>

          {/* =========================
              ACTIONS
          ========================= */}
          <div style={styles.box}>

            <h3
              style={
                styles.sectionTitle
              }
            >
              Acciones rápidas
            </h3>

            <button
              style={
                styles.button
              }
              onClick={() =>
                setView(
                  "users"
                )
              }
            >
              Ver usuarios
            </button>

            <button
              style={
                styles.button
              }
              onClick={() =>
                setView(
                  "logs"
                )
              }
            >
              Ver logs
            </button>

            <button
              style={
                styles.button
              }
              onClick={
                exportUsers
              }
            >
              Exportar reporte
            </button>

            <button
              style={
                styles.dangerButton
              }
              onClick={() => {

                localStorage.clear();

                addLog(
                  "Cache limpiada"
                );

                alert(
                  "Cache limpiada"
                );

              }}
            >
              Limpiar cache
            </button>

          </div>

        </div>
      )}

      {/* =========================
          USERS
      ========================= */}
      {view === "users" && (
        <div
          style={
            styles.bigPanel
          }
        >

          <div
            style={
              styles.topBar
            }
          >

            <h2
              style={
                styles.title
              }
            >
              👥 Usuarios
            </h2>

            <button
              style={
                styles.backBtn
              }
              onClick={() =>
                setView(
                  "dashboard"
                )
              }
            >
              ← Volver
            </button>

          </div>

          <div
            style={
              styles.userList
            }
          >

            {users.map((u) => (
              <div
                key={
                  u.id_usuario
                }
                style={
                  styles.userCard
                }
              >

                <div>

                  <h3
                    style={
                      styles.userName
                    }
                  >
                    {u.nombre}
                  </h3>

                  <p
                    style={
                      styles.userEmail
                    }
                  >
                    {u.email}
                  </p>

                  <span
                    style={
                      styles.userRole
                    }
                  >
                    {u.role}
                  </span>

                </div>

                <div
                  style={
                    styles.actions
                  }
                >

                  <button
                    style={
                      styles.editBtn
                    }
                    onClick={() =>
                      setEdit(u)
                    }
                  >
                    Editar
                  </button>

                  <button
                    style={
                      styles.deleteBtn
                    }
                    onClick={() =>
                      deleteUser(
                        u.id_usuario
                      )
                    }
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
      {view === "logs" && (
        <div style={styles.card}>

          <h2
            style={styles.title}
          >
            📜 Logs sistema
          </h2>

          <div
            style={
              styles.logsBox
            }
          >

            {logs.map(
              (
                log,
                index
              ) => (
                <div
                  key={index}
                  style={
                    styles.log
                  }
                >
                  {log}
                </div>
              )
            )}

          </div>

          <button
            style={
              styles.backButton
            }
            onClick={() =>
              setView(
                "dashboard"
              )
            }
          >
            Volver
          </button>

        </div>
      )}

      {/* =========================
          MODAL
      ========================= */}
      {edit && (
        <div style={styles.modal}>

          <div
            style={
              styles.modalBox
            }
          >

            <h2
              style={
                styles.title
              }
            >
              Editar usuario
            </h2>

            <input
              style={
                styles.input
              }
              value={
                edit.nombre
              }
              onChange={(e) =>
                setEdit({
                  ...edit,
                  nombre:
                    e.target
                      .value,
                })
              }
            />

            <input
              style={
                styles.input
              }
              value={
                edit.email
              }
              onChange={(e) =>
                setEdit({
                  ...edit,
                  email:
                    e.target
                      .value,
                })
              }
            />

            <select
              style={
                styles.input
              }
              value={
                edit.role
              }
              onChange={(e) =>
                setEdit({
                  ...edit,
                  role:
                    e.target
                      .value,
                })
              }
            >
              <option value="user">
                user
              </option>

              <option value="admin">
                admin
              </option>
            </select>

            <div
              style={
                styles.actions
              }
            >

              <button
                style={
                  styles.editBtn
                }
                onClick={
                  saveUser
                }
              >
                Guardar
              </button>

              <button
                style={
                  styles.deleteBtn
                }
                onClick={() =>
                  setEdit(
                    null
                  )
                }
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at center, #050505, #000)",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    padding: 20,
    fontFamily: "Arial",
  },

  card: {
    width: "90%",
    maxWidth: 550,
    background:
      "rgba(10,10,10,0.92)",
    borderRadius: 20,
    padding: 25,
    border:
      "1px solid rgba(0,229,255,0.2)",
    boxShadow:
      "0 0 40px rgba(0,229,255,0.15)",
  },

  bigPanel: {
    width: "95%",
    maxWidth: 1100,
    background:
      "rgba(10,10,10,0.92)",
    borderRadius: 20,
    padding: 25,
    border:
      "1px solid rgba(0,229,255,0.2)",
    boxShadow:
      "0 0 40px rgba(0,229,255,0.15)",
  },

  topBar: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    color: "#00e5ff",
  },

  subtitle: {
    color: "#aaa",
    marginBottom: 20,
  },

  sectionTitle: {
    color: "#00e5ff",
    marginBottom: 10,
  },

  box: {
    background: "#111",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    color: "#ddd",
  },

  button: {
    width: "100%",
    padding: 10,
    marginTop: 8,
    borderRadius: 8,
    border:
      "1px solid rgba(0,229,255,0.3)",
    background:
      "transparent",
    color: "#00e5ff",
    cursor: "pointer",
  },

  dangerButton: {
    width: "100%",
    padding: 10,
    marginTop: 8,
    borderRadius: 8,
    border: "none",
    background: "#ff3b3b",
    color: "#fff",
    cursor: "pointer",
  },

  logoutBtn: {
    background: "#ff3b3b",
    border: "none",
    color: "#fff",
    padding: "10px 15px",
    borderRadius: 8,
    cursor: "pointer",
  },

  backBtn: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    background: "#00e5ff",
    cursor: "pointer",
    fontWeight: "bold",
  },

  userList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  userCard: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    background: "#111",
    padding: 15,
    borderRadius: 12,
  },

  userName: {
    color: "#fff",
    margin: 0,
  },

  userEmail: {
    color: "#aaa",
  },

  userRole: {
    color: "#00e5ff",
  },

  actions: {
    display: "flex",
    gap: 10,
  },

  editBtn: {
    background: "#00e5ff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
  },

  deleteBtn: {
    background: "#ff3b3b",
    border: "none",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },

  logsBox: {
    maxHeight: 350,
    overflowY: "auto",
  },

  log: {
    background:
      "rgba(255,255,255,0.03)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    color: "#ddd",
  },

  backButton: {
    width: "100%",
    marginTop: 15,
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "#00e5ff",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
  },

  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
  },

  modalBox: {
    width: 350,
    background: "#111",
    padding: 20,
    borderRadius: 15,
  },

  input: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    border:
      "1px solid #333",
    background: "#000",
    color: "#fff",
    boxSizing: "border-box",
  },
};
