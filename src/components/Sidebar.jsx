import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, PackagePlus, ClipboardList, FileText, ShoppingCart, Receipt,
  FileCheck2, Truck, Building2, BookOpen, ArrowLeftRight, CheckCircle2, BarChart3,
  Warehouse, PackageSearch, Users,
  PanelLeftClose, PanelLeftOpen, Menu, X, Sun, Moon, Flame, RefreshCw, LogOut, Bell,
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "../context/ThemeContext";
import { fetchAuth } from "../utils/fetchAuth";
import PanelNotificaciones from "./PanelNotificaciones";

const LINKS_VENDEDOR = [
  { to: "/dashboard",         label: "Dashboard",           icon: LayoutDashboard },
  { to: "/ingresos-equipo",   label: "Ingreso de Equipos",  icon: PackagePlus },
  { to: "/ordenes-trabajo",   label: "Órdenes de Trabajo",  icon: ClipboardList },
  { to: "/cotizaciones",      label: "Presupuesto",         icon: FileText },
  { to: "/ordenes-compra",    label: "Órdenes de Compra",   icon: ShoppingCart },
  { to: "/facturas",          label: "Facturas",            icon: Receipt },
  { to: "/comprobantes",      label: "Comprobantes",        icon: FileCheck2 },
  { to: "/guias",             label: "Guías de Remisión",   icon: Truck },
  { to: "/empresas",          label: "Empresas",            icon: Building2 },
  { to: "/catalogo-servicios", label: "Catálogo de Servicios", icon: BookOpen },
  { to: "/tipo-cambio",       label: "Tipo de Cambio",      icon: ArrowLeftRight },
  { to: "/aprobaciones",      label: "Aprobaciones",        icon: CheckCircle2 },
  { to: "/reportes",          label: "Reportes",            icon: BarChart3 },
];

const LINKS_TECNICO = [
  { to: "/ingresos-equipo", label: "Ingreso de Equipos", icon: PackagePlus },
  { to: "/ordenes-trabajo", label: "Órdenes de Trabajo", icon: ClipboardList },
];

const LINKS_ALMACEN = [
  { to: "/almacen",    label: "Almacén",    icon: Warehouse },
  { to: "/inventario", label: "Inventario", icon: PackageSearch },
];

const TEMAS = [
  { id: "light", label: "Claro",  icon: Sun },
  { id: "dark",  label: "Oscuro", icon: Moon },
  { id: "warm",  label: "Cálido", icon: Flame },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario  = JSON.parse(localStorage.getItem("usuario") || "null");
  const [abierto, setAbierto] = useState(false);
  const { colapsado, setColapsado } = useSidebar();
  const { tema, setTema } = useTheme();

  const [notificaciones, setNotificaciones] = useState([]);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [vistasHasta, setVistasHasta] = useState(() => Number(localStorage.getItem("notif_vistas_hasta")) || 0);

  useEffect(() => {
    const cargar = () => {
      fetchAuth("/notificaciones")
        .then((r) => r.ok && r.json())
        .then((data) => data && setNotificaciones(data));
    };
    cargar();
    const intervalo = setInterval(cargar, 60000);
    return () => clearInterval(intervalo);
  }, []);

  const sinVer = notificaciones.filter((n) => new Date(n.fecha).getTime() > vistasHasta).length;

  const togglePanel = () => {
    if (!panelAbierto) {
      const ahora = Date.now();
      localStorage.setItem("notif_vistas_hasta", String(ahora));
      setVistasHasta(ahora);
    }
    setPanelAbierto((v) => !v);
  };

  const cerrarSesion = () => { localStorage.clear(); navigate("/login"); };

  const esVendedorOAdmin = ["admin", "vendedor"].includes(usuario?.rol);
  const esTecnico        = usuario?.rol === "tecnico";
  const puedeVerAlmacen  = ["admin", "almacenero"].includes(usuario?.rol);
  const esAdmin          = usuario?.rol === "admin";

  const links = [
    ...(esVendedorOAdmin ? LINKS_VENDEDOR : []),
    ...(esTecnico        ? LINKS_TECNICO  : []),
    ...(puedeVerAlmacen  ? LINKS_ALMACEN  : []),
    ...(esAdmin          ? [{ to: "/usuarios", label: "Usuarios", icon: Users }] : []),
  ];

  const inicioPath = esTecnico ? "/ordenes-trabajo" : (puedeVerAlmacen && !esVendedorOAdmin ? "/almacen" : "/dashboard");
  const esActivo = (to) => location.pathname === to || (to !== inicioPath && location.pathname.startsWith(to));

  const inicial = (usuario?.nombre ?? "U")[0].toUpperCase();
  const irA = (to) => { navigate(to); setAbierto(false); };

  return (
    <>
      {/* Header móvil */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-sidebar border-b border-sidebar-border">
        <button onClick={() => irA(inicioPath)} className="flex items-center gap-2">
          <span className="font-bold text-sidebar-ink text-sm tracking-tight">SIP App — Tecnotronica</span>
        </button>
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="w-9 h-9 rounded-lg text-sidebar-ink-soft hover:text-sidebar-ink transition-colors flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Overlay móvil */}
      {abierto && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setAbierto(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ${
          colapsado ? "w-[72px]" : "w-60"
        } ${abierto ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Toggle colapso (desktop) */}
        <button
          onClick={() => setColapsado(!colapsado)}
          aria-label={colapsado ? "Expandir menú" : "Colapsar menú"}
          className="hidden md:flex absolute top-6 -right-3 w-6 h-6 rounded-full bg-surface border border-line-strong text-ink-soft hover:text-accent hover:border-accent shadow-sm items-center justify-center z-10"
        >
          {colapsado ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
        </button>

        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-4 border-b border-sidebar-border shrink-0 overflow-hidden">
          <button onClick={() => irA(inicioPath)} className="flex items-center gap-2.5 shrink-0 min-w-0">
            {!colapsado && (
              <span className="font-bold text-sidebar-ink text-sm tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                SIP App — Tecnotronica
              </span>
            )}
            {colapsado && <span className="font-bold text-sidebar-ink text-lg">S</span>}
          </button>
          <button
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
            className="md:hidden ml-auto w-8 h-8 rounded-lg text-sidebar-ink-soft hover:text-sidebar-ink transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
          {links.map((l) => {
            const Icon   = l.icon;
            const activo = esActivo(l.to);
            return (
              <button
                key={l.to}
                onClick={() => irA(l.to)}
                aria-label={l.label}
                className={`group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activo
                    ? "bg-accent text-white shadow-sm"
                    : "text-sidebar-ink-soft hover:bg-white/5 hover:text-sidebar-ink"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!colapsado && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">{l.label}</span>
                )}
                {colapsado && (
                  <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-ink text-app-bg text-xs font-medium px-2 py-1 opacity-0 scale-95 origin-left transition-all group-hover:opacity-100 group-hover:scale-100 z-50">
                    {l.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer: tema + notificaciones + usuario + acciones */}
        <div className="border-t border-sidebar-border p-3 space-y-3 shrink-0">
          <div className={`flex items-center gap-1 bg-black/20 rounded-lg p-1 ${colapsado ? "flex-col" : ""}`}>
            {TEMAS.map((t) => {
              const Icon   = t.icon;
              const activo = tema === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTema(t.id)}
                  aria-label={`Tema ${t.label}`}
                  title={t.label}
                  className={`flex-1 flex items-center justify-center rounded-md py-1.5 transition-colors ${
                    activo ? "bg-surface text-accent shadow-sm" : "text-sidebar-ink-soft hover:text-sidebar-ink"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          <div className={`flex items-center gap-2 ${colapsado ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold shrink-0">
              {inicial}
            </div>
            {!colapsado && (
              <div className="leading-tight overflow-hidden">
                <p className="text-sm font-semibold text-sidebar-ink truncate">{usuario?.nombre}</p>
                <p className="text-xs text-sidebar-ink-soft capitalize">{usuario?.rol}</p>
              </div>
            )}
          </div>

          <div className={`flex items-center gap-1 ${colapsado ? "flex-col" : ""}`}>
            <button
              onClick={togglePanel}
              aria-label="Notificaciones"
              className="relative flex-1 w-8 h-8 rounded-lg text-sidebar-ink-soft hover:text-sidebar-ink hover:bg-black/20 transition-colors flex items-center justify-center"
            >
              <Bell className="w-4 h-4" />
              {sinVer > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {sinVer > 9 ? "9+" : sinVer}
                </span>
              )}
            </button>
            <button
              onClick={() => window.location.reload()}
              aria-label="Actualizar"
              className="flex-1 w-8 h-8 rounded-lg text-sidebar-ink-soft hover:text-sidebar-ink hover:bg-black/20 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={cerrarSesion}
              aria-label="Cerrar sesión"
              className="flex-1 w-8 h-8 rounded-lg text-sidebar-ink-soft hover:text-red-400 hover:bg-black/20 transition-colors flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {panelAbierto && (
        <PanelNotificaciones notificaciones={notificaciones} onClose={() => setPanelAbierto(false)} />
      )}
    </>
  );
}
