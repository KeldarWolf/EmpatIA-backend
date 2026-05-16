import { Routes, Route, Navigate } from "react-router-dom";

// AUTH
import Login from "./pages/Login/Login";
import Register from "./pages/Register";

// DASHBOARD
import User from "./pages/User/User";
import Admin from "./pages/Admin";

// MODULES
import Rutina from "./pages/Rutina";
import Actividades from "./pages/User/Actividades/Actividades";
import Estadisticas from "./pages/User/Estadisticas/Estadisticas";
import Motivacion from "./pages/Motivacion";
import Diario from "./pages/Diario";
import Gustos from "./pages/Gustos";
import Configuracion from "./pages/Configuracion";

// =========================
// PRIVATE ROUTE
// =========================
function PrivateRoute({ children, role }) {
  const session = JSON.parse(localStorage.getItem("usuario"));

  // ❌ sin sesión
  if (!session) {
    return <Navigate to="/" replace />;
  }

  const userRole = (session.role || "").toLowerCase().trim();

  // 🔒 si requiere role específico
  if (role && userRole !== role) {
    return <Navigate to="/user" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>

      {/* ================= LOGIN ================= */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ================= ADMIN ================= */}
      <Route
        path="/admin"
        element={
          <PrivateRoute role="admin">
            <Admin />
          </PrivateRoute>
        }
      />

      {/* ================= USER ================= */}
      <Route
        path="/user"
        element={
          <PrivateRoute role="user">
            <User />
          </PrivateRoute>
        }
      />

      {/* ================= MODULES ================= */}
      <Route
        path="/rutina"
        element={
          <PrivateRoute>
            <Rutina />
          </PrivateRoute>
        }
      />

      <Route
        path="/actividades"
        element={
          <PrivateRoute>
            <Actividades />
          </PrivateRoute>
        }
      />

      <Route
        path="/estadisticas"
        element={
          <PrivateRoute>
            <Estadisticas />
          </PrivateRoute>
        }
      />

      <Route
        path="/motivacion"
        element={
          <PrivateRoute>
            <Motivacion />
          </PrivateRoute>
        }
      />

      <Route
        path="/diario"
        element={
          <PrivateRoute>
            <Diario />
          </PrivateRoute>
        }
      />

      <Route
        path="/gustos"
        element={
          <PrivateRoute>
            <Gustos />
          </PrivateRoute>
        }
      />

      <Route
        path="/configuracion"
        element={
          <PrivateRoute>
            <Configuracion />
          </PrivateRoute>
        }
      />

    </Routes>
  );
}
