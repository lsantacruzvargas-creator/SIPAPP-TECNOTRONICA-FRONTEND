import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const enlace = ({ isActive }) =>
  isActive
    ? "text-white font-semibold text-sm"
    : "text-gray-400 hover:text-white text-sm transition";

export default function Navbar() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const [abierto, setAbierto] = useState(false);

  const cerrarSesion = () => {
    localStorage.clear();
    navigate("/login");
  };

  const esVendedorOAdmin = ["admin", "vendedor"].includes(usuario?.rol);
  const esTecnico = usuario?.rol === "tecnico";

  return (
    <nav className="bg-gray-900 text-white px-4 py-3">
      <div className="flex items-center justify-between">
        <NavLink
          to={esTecnico ? "/ordenes-trabajo" : "/dashboard"}
          className="font-bold text-lg tracking-tight hover:text-gray-300"
        >
          SIP App — Tecnotronica
        </NavLink>

        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setAbierto(!abierto)}
        >
          ☰
        </button>

        <div className="hidden md:flex items-center gap-6">
          {esVendedorOAdmin && (
            <>
              <NavLink to="/ingresos-equipo" className={enlace}>Ingreso de Equipos</NavLink>
              <NavLink to="/ordenes-trabajo" className={enlace}>Órdenes de Trabajo</NavLink>
              <NavLink to="/cotizaciones" className={enlace}>Presupuesto</NavLink>
              <NavLink to="/ordenes-compra" className={enlace}>Órdenes de Compra</NavLink>
              <NavLink to="/facturas" className={enlace}>Facturas</NavLink>
              <NavLink to="/empresas" className={enlace}>Empresas</NavLink>
            </>
          )}
          {esTecnico && (
            <>
              <NavLink to="/ingresos-equipo" className={enlace}>Ingreso de Equipos</NavLink>
              <NavLink to="/ordenes-trabajo" className={enlace}>Órdenes de Trabajo</NavLink>
            </>
          )}


          {usuario?.rol === "admin" && (
            <NavLink to="/usuarios" className={enlace}>Usuarios</NavLink>
          )}

          <span className="text-xs text-gray-500">
            {usuario?.nombre} · {usuario?.rol}
          </span>
          <button
            onClick={() => window.location.reload()}
            title="Actualizar página"
            className="text-gray-400 hover:text-white transition text-base leading-none"
          >
            ↻
          </button>
          <button
            onClick={cerrarSesion}
            className="text-sm border border-gray-600 px-3 py-1 rounded hover:bg-gray-700 transition"
          >
            Salir
          </button>
        </div>
      </div>

      {abierto && (
        <div className="mt-3 flex flex-col gap-3 md:hidden border-t border-gray-700 pt-3">
          {esVendedorOAdmin && (
            <>
              <NavLink to="/empresas" className={enlace} onClick={() => setAbierto(false)}>Empresas</NavLink>
              <NavLink to="/cotizaciones" className={enlace} onClick={() => setAbierto(false)}>Cotizaciones</NavLink>
              <NavLink to="/ordenes-trabajo" className={enlace} onClick={() => setAbierto(false)}>Órdenes de Trabajo</NavLink>
              <NavLink to="/ingresos-equipo" className={enlace} onClick={() => setAbierto(false)}>Ingreso de Equipos</NavLink>
              <NavLink to="/ordenes-compra" className={enlace} onClick={() => setAbierto(false)}>Órdenes de Compra</NavLink>
              <NavLink to="/facturas" className={enlace} onClick={() => setAbierto(false)}>Facturas</NavLink>

            </>
          )}
          {esTecnico && (
            <>
              <NavLink to="/ordenes-trabajo" className={enlace} onClick={() => setAbierto(false)}>Órdenes de Trabajo</NavLink>
              <NavLink to="/ingresos-equipo" className={enlace} onClick={() => setAbierto(false)}>Ingreso de Equipos</NavLink>
            </>
          )}
          {usuario?.rol === "admin" && (
            <NavLink to="/usuarios" className={enlace} onClick={() => setAbierto(false)}>Usuarios</NavLink>
          )}
          <span className="text-xs text-gray-500">{usuario?.nombre} · {usuario?.rol}</span>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-gray-400 hover:text-white transition w-fit"
          >
            ↻ Actualizar
          </button>
          <button onClick={cerrarSesion} className="text-sm border border-gray-600 px-3 py-1 rounded hover:bg-gray-700 transition w-fit">
            Salir
          </button>
        </div>
      )}
    </nav>
  );
}
