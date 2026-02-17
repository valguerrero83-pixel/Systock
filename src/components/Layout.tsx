import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";


import ModalNuevoRepuesto from "./ModalNuevoRepuesto";
import ModalNuevoEmpleado from "./ModalNuevoEmpleado";

import {
  obtenerTotalRepuestos,
  obtenerStockBajo,
  obtenerMovimientosHoy,
} from "../services/dashboardService";

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ------------------------------------------
  // STATE
  // ------------------------------------------
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEmpleadoAbierto, setModalEmpleadoAbierto] = useState(false);

  const [totalRepuestos, setTotalRepuestos] = useState(0);
  const [stockBajo, setStockBajo] = useState(0);
  const [movimientosHoy, setMovimientosHoy] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);


  // ------------------------------------------
  // ROLES
  // ------------------------------------------
  const [role, setRole] = useState({
    esAdmin: false,
    esJefe: false,
    esGerente: false,
    esViewer: false,
  });

  useEffect(() => {
    if (!usuario) return;

    setRole({
      esAdmin: usuario.rol_usuario === "dev",
      esJefe: usuario.rol_usuario === "jefe",
      esGerente: usuario.rol_usuario === "gerente",
      esViewer: usuario.rol_usuario === "viewer",
    });
  }, [usuario]);
  // ---------------- DARK MODE ----------------
    const [darkMode, setDarkMode] = useState<boolean>(() => {
      return localStorage.getItem("theme") === "dark";
    });

  // ------------------------------------------
  // DASHBOARD
  // ------------------------------------------
  async function cargarDashboard() {
    setTotalRepuestos(await obtenerTotalRepuestos());
    setStockBajo(await obtenerStockBajo());
    setMovimientosHoy(await obtenerMovimientosHoy());
  }

  useEffect(() => {
    cargarDashboard();
    const intervalo = setInterval(cargarDashboard, 5000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    cargarDashboard();
  }, [location]);

  useEffect(() => {
    const listener = () => cargarDashboard();
    window.addEventListener("dashboard-update", listener);
    return () => window.removeEventListener("dashboard-update", listener);
  }, []);

 useEffect(() => {
  const root = document.documentElement;

  if (darkMode) {
    root.classList.add("dark");
    localStorage.setItem("theme", "dark"); // 👈 GUARDAMOS
  } else {
    root.classList.remove("dark");
    localStorage.setItem("theme", "light"); // 👈 GUARDAMOS
  }
}, [darkMode]);




  // ------------------------------------------
  // RETURN
  // ------------------------------------------
  return (
  <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300" >

    {/* ================= SIDEBAR ================= */}
  {/* Overlay solo mobile */}
  {sidebarOpen && (
    <div
      className="fixed inset-0 bg-black/40 z-40 lg:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  )}

  <aside
    className={`
      fixed lg:relative
      z-50
      top-0 left-0
      h-full lg:h-auto
      w-64
      bg-white dark:bg-slate-900
      border-r border-slate-200 dark:border-slate-800
      p-6
      transform transition-transform duration-300
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      lg:translate-x-0
      flex flex-col
    `}
  >

      <div className="flex items-center gap-3 mb-10">
        <img src="/favicon.png" className="w-9 h-9 rounded-md" />
        <div>
          <h1 className="font-bold text-slate-800 dark:text-white">
            Systock
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            Inventario
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-2 text-sm">

        {(role.esAdmin || role.esJefe) && (
          <SidebarItem to="/salidas" label="Salidas" />
        )}

        {role.esAdmin && (
          <SidebarItem to="/entradas" label="Entradas" />
        )}

        <SidebarItem to="/inventario" label="Inventario" />
        <SidebarItem to="/historial" label="Historial" />

        {role.esAdmin && (
          <SidebarItem to="/empleados" label="Empleados" />
        )}
      </nav>
    </aside>

    {/* ================= MAIN AREA ================= */}
    <div className="flex-1 min-h-screen bg-white dark:bg-[#0B1120] overflow-x-hidden">




      {/* -------- TOP BAR -------- */}
<header
  className="
    bg-white dark:bg-slate-900 
    border-b border-slate-200 dark:border-slate-800 
    px-6 py-4 
    flex justify-between items-center
  "
>
  {/* Botón menú móvil */}
  <button
    onClick={() => setSidebarOpen(true)}
    className="lg:hidden p-2 rounded-md 
    hover:bg-slate-200 dark:hover:bg-slate-800 transition"
  >
    ☰
  </button>

  {/* Saludo */}
  <div>
    {usuario?.nombre && (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Hola, <span className="font-semibold">{usuario.nombre}</span> 👋
      </p>
    )}
  </div>

  {/* Acciones derecha */}
  <div className="flex items-center gap-3">

    {/* DARK MODE */}
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="
        relative w-12 h-6 flex items-center 
        bg-slate-200 dark:bg-slate-700 
        rounded-full p-1 transition-colors duration-300
      "
    >
      <div
        className={`
          w-4 h-4 bg-white rounded-full shadow-md 
          transform transition-transform duration-300 
          ${darkMode ? "translate-x-6" : "translate-x-0"}
        `}
      />
      <span className="absolute left-1 text-yellow-500 text-xs">☀️</span>
      <span className="absolute right-1 text-slate-300 text-xs">🌙</span>
    </button>

    {/* BOTÓN EMPLEADO */}
    {role.esAdmin && (
      <button
        onClick={() => setModalEmpleadoAbierto(true)}
        className="
          px-4 py-2 rounded-xl text-sm font-medium
          bg-slate-200 text-slate-800
          hover:bg-slate-300
          dark:bg-slate-700 dark:text-white
          dark:hover:bg-slate-600
          transition
        "
      >
        Empleado
      </button>
    )}

    {/* BOTÓN REPUESTO */}
    {role.esAdmin && (
      <button
        onClick={() => setModalAbierto(true)}
        className="
          px-4 py-2 rounded-xl text-sm font-medium
          bg-indigo-600 text-white
          hover:bg-indigo-700
          shadow-sm hover:shadow-md
          transition
        "
      >
        Repuesto
      </button>
    )}

    {/* LOGOUT */}
    <button
      onClick={async () => {
        await logout();
        navigate("/login", { replace: true });
      }}
      className="
        p-2 text-red-500 
        hover:bg-red-100 
        dark:hover:bg-red-900/40 
        rounded-lg transition
      "
    >
      {logoutIcon()}
    </button>

  </div>
</header>

      {/* -------- DASHBOARD -------- */}
      <section className="p-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <DashboardCard
            title="Total Repuestos"
            value={totalRepuestos}
            subtitle="En inventario"
          />

          <DashboardCard
            title="Stock Bajo"
            value={stockBajo}
            subtitle="Requieren atención"
          />

          <DashboardCard
            title="Movimientos Hoy"
            value={movimientosHoy}
            subtitle="Registrados"
          />

        </div>

        <Outlet />

      </section>

    </div>

    {/* ================= MODALS ================= */}
    <ModalNuevoRepuesto
      abierto={modalAbierto}
      onClose={() => setModalAbierto(false)}
      onCreated={() => {}}
    />

    <ModalNuevoEmpleado
      abierto={modalEmpleadoAbierto}
      onClose={() => setModalEmpleadoAbierto(false)}
      onCreated={() => {}}
    />

  </div>
);


/* ---------------------- COMPONENTES AUXILIARES ---------------------- */

function DashboardCard({ title, value, subtitle }: any) {

  return (
    <div className="bg-white dark:bg-slate-900 
      border border-slate-200 dark:border-slate-800
      rounded-2xl p-6 shadow-sm
      hover:shadow-md hover:-translate-y-1
      transition-all duration-300">

      <h3 className="text-sm text-slate-500 dark:text-slate-300">
        {title}
      </h3>

      <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">
        {value}
      </p>

      <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
        {subtitle}
      </p>
    </div>
  );
}


function SidebarItem({ to, label }: any) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-4 py-2 rounded-lg transition text-sm
        ${
          isActive
            ? "bg-indigo-600 text-white"
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`
      }
    >
      {label}
    </NavLink>
  );
}


/* ---------------------- ICONOS ---------------------- */

function logoutIcon() {
  return (
    <svg width="22" height="22" stroke="currentColor" fill="none" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function userIcon() {
  return (
    <svg width="22" height="22" stroke="currentColor" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a7 7 0 0 1 13 0" />
    </svg>
  );
}

function packageIcon() {
  return (
    <svg width="22" height="22" stroke="currentColor" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <polyline points="3 7 12 2 21 7" />
    </svg>
  );
}

function repeatIcon() {
  return (
    <svg width="22" height="22" stroke="currentColor" fill="none" viewBox="0 0 24 24">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function clipboardIcon() {
  return (
    <svg width="22" height="22" stroke="currentColor" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </svg>
  );
}

function historyIcon() {
  return (
    <svg width="22" height="22" stroke="currentColor" fill="none" viewBox="0 0 24 24">
      <polyline points="16 3 21 3 21 8" />
      <line x1="21" y1="3" x2="12" y2="12" />
      <path d="M21 12a9 9 0 1 1-9-9" />
    </svg>
  );
}

function iconBox() {
  return (
    <svg width="32" height="32" stroke="currentColor" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <polyline points="3 7 12 2 21 7" />
    </svg>
  );
}

function iconWarning() {
  return (
    <svg width="32" height="32" stroke="currentColor" fill="none" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  );
}

function iconRepeat() {
  return (
    <svg width="32" height="32" stroke="currentColor" fill="none" viewBox="0 0 24 24">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  );
}}
