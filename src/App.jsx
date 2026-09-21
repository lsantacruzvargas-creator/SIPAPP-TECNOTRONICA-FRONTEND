import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import AlertaGlobal from "./components/AlertaGlobal";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider, useSidebar } from "./context/SidebarContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Empresas from "./pages/Empresas";
import ListaCotizaciones from "./pages/ListaCotizaciones";
import Cotizaciones from "./pages/Cotizaciones";
import ListaOrdenesTrabajo from "./pages/ListaOrdenesTrabajo";
import ListaFacturas from "./pages/ListaFacturas";
import ListaOrdenesCompra from "./pages/ListaOrdenesCompra";
import IngresoEquipos from "./pages/IngresoEquipos";
import Usuarios from "./pages/Usuarios";
import Almacen from "./pages/Almacen";
import Inventario from "./pages/Inventario";
import CatalogoServicios from "./pages/CatalogoServicios";
import TipoCambio from "./pages/TipoCambio";
import Aprobaciones from "./pages/Aprobaciones";
import Reportes from "./pages/Reportes";
import ListaComprobantes from "./pages/ListaComprobantes";
import EmitirComprobante from "./pages/EmitirComprobante";
import ListaGuias from "./pages/ListaGuias";
import EmitirGuia from "./pages/EmitirGuia";
import NotFound from "./pages/NotFound";

function AppShell({ children }) {
  const { colapsado } = useSidebar();
  return (
    <div className="min-h-screen bg-app-bg">
      <Sidebar />
      <main className={`min-h-screen transition-[margin] duration-200 ${colapsado ? "md:ml-[72px]" : "md:ml-60"}`}>
        <AlertaGlobal />
        {children}
      </main>
    </div>
  );
}

function Layout({ children }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppShell>{children}</AppShell>
      </SidebarProvider>
    </ThemeProvider>
  );
}

function HomeRedirect() {
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!token || !usuario) return <Navigate to="/login" replace />;
  if (usuario.rol === "tecnico") return <Navigate to="/ordenes-trabajo" replace />;
  if (usuario.rol === "almacenero") return <Navigate to="/almacen" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />



      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["admin", "vendedor"]}>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresas"
        element={
          <ProtectedRoute roles={["admin", "vendedor"]}>
            <Layout><Empresas /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cotizaciones"
        element={
          <ProtectedRoute roles={["admin", "vendedor"]}>
            <Layout><ListaCotizaciones /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cotizaciones/nueva"
        element={
          <ProtectedRoute roles={["admin", "vendedor"]}>
            <Layout><Cotizaciones /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ordenes-trabajo"
        element={
          <ProtectedRoute roles={["admin", "vendedor", "tecnico"]}>
            <Layout><ListaOrdenesTrabajo /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/facturas"
        element={
          <ProtectedRoute roles={["admin", "vendedor"]}>
            <Layout><ListaFacturas /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ordenes-compra"
        element={
          <ProtectedRoute roles={["admin", "vendedor"]}>
            <Layout><ListaOrdenesCompra /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ingresos-equipo"
        element={
          <ProtectedRoute roles={["admin", "vendedor", "tecnico"]}>
            <Layout><IngresoEquipos /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/almacen"
        element={
          <ProtectedRoute roles={["admin", "almacenero"]}>
            <Layout><Almacen /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventario"
        element={
          <ProtectedRoute roles={["admin", "almacenero"]}>
            <Layout><Inventario /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/catalogo-servicios"
        element={
          <ProtectedRoute roles={["admin", "vendedor"]}>
            <Layout><CatalogoServicios /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tipo-cambio"
        element={
          <ProtectedRoute roles={["admin", "vendedor"]}>
            <Layout><TipoCambio /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/aprobaciones"
        element={
          <ProtectedRoute roles={["admin", "vendedor"]}>
            <Layout><Aprobaciones /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reportes"
        element={
          <ProtectedRoute roles={["admin", "vendedor"]}>
            <Layout><Reportes /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/comprobantes"
        element={
          <ProtectedRoute roles={["admin", "vendedor"]}>
            <Layout><ListaComprobantes /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/comprobantes/emitir"
        element={
          <ProtectedRoute roles={["admin", "vendedor"]}>
            <Layout><EmitirComprobante /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/guias"
        element={
          <ProtectedRoute roles={["admin", "vendedor", "almacenero"]}>
            <Layout><ListaGuias /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/guias/emitir"
        element={
          <ProtectedRoute roles={["admin", "vendedor", "almacenero"]}>
            <Layout><EmitirGuia /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Layout><Usuarios /></Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
