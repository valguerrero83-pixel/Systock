// src/components/Layout.tsx
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

import ModalNuevoRepuesto from "../components/ModalNuevoRepuesto";
import ModalNuevoEmpleado from "./ModalNuevoEmpleado";

import {
  obtenerTotalRepuestos,
  obtenerStockBajo,
  obtenerMovimientosHoy
} from "../services/dashboardService";

export default function Layout() {
  const { usuario, logout } = useAuth();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEmpleadoAbierto, setModalEmpleadoAbierto] = useState(false);

  const [totalRepuestos, setTotalRepuestos] = useState(0);
  const [stockBajo, setStockBajo] = useState(0);
  const [movimientosHoy, setMovimientosHoy] = useState(0);

  async function cargarDashboard() {
    setTotalRepuestos(await obtenerTotalRepuestos());
    setStockBajo(await obtenerStockBajo());
    setMovimientosHoy(await obtenerMovimientosHoy());
  }

  useEffect(() => {
    cargarDashboard();
  }, []);

  const esAdmin =
    usuario?.rol_usuario === "admin" || usuario?.rol_usuario === "dev";

  const esJefe = usuario?.rol_usuario === "jefe";

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col">

      {/* --------------------- BARRA SUPERIOR --------------------- */}
      <header className="w-full bg-white shadow-sm px-4 md:px-8 py-4 
        flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b">

        {/* LOGO + TÍTULO */}
        <div className="flex items-center gap-3">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round" className="text-slate-800">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 
            2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.3 7.3 12 12 20.7 7.3" />
            <line x1="12" y1="22" x2="12" y2="12" />
          </svg>

          <div>
            <h1 className="text-xl font-bold text-slate-800">Stock Mantenimiento</h1>
            <p className="text-sm text-gray-500 -mt-1">Control de inventario</p>
          
        {usuario?.nombre && (
        <p className="text-sm text-gray-600 mt-1">
          Hola, <span className="font-semibold text-gray-800">{usuario.nombre}</span> 👋
        </p>
      )}
      </div>
        </div>

        {/* --------------------- NAV SUPERIOR --------------------- */}
        <nav className="flex items-center gap-3 flex-wrap justify-start md:justify-end">

          {/* Crear Empleado → SOLO ADMIN / DEV */}
          {esAdmin && (
            <>
              <TopButton
                icon={userIcon()}
                label="Empleado"
                primary={false}
                onClick={() => setModalEmpleadoAbierto(true)}
              />

              <ModalNuevoEmpleado
                abierto={modalEmpleadoAbierto}
                onClose={() => setModalEmpleadoAbierto(false)}
                onCreated={() => {}}
              />
            </>
          )}

          {/* Crear Repuesto → SOLO ADMIN / DEV */}
          {esAdmin && (
            <button
              onClick={() => setModalAbierto(true)}
              className="px-4 py-2 rounded-lg flex items-center gap-2 border transition
              bg-gray-600 text-white hover:bg-gray-700"
            >
              {packageIcon()}
              <span className="text-sm">Repuesto</span>
            </button>
          )}

          {/* Logout */}
          <button
            onClick={async () => {
              await logout();
              window.location.href = "/login";
            }}
            className="p-2 rounded-md text-red-600 hover:bg-red-100 transition"
          >
            {logoutIcon()}
          </button>

        </nav>
      </header>

      {/* ---------------- DASHBOARD CARDS ---------------- */}
      <section className="w-full px-4 md:px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          {/* Total repuestos */}
          <DashboardCard
            title="TOTAL REPUESTOS"
            value={totalRepuestos}
            subtitle="En inventario"
            color="green"
            icon={iconBox()}
          />

          {/* Stock bajo */}
          <DashboardCard
            title="STOCK BAJO"
            value={stockBajo}
            subtitle="Requieren atención"
            color="yellow"
            icon={iconWarning()}
          />

          {/* Movimientos hoy */}
          <DashboardCard
            title="MOVIMIENTOS HOY"
            value={movimientosHoy}
            subtitle="Movimientos registrados"
            color="green"
            icon={iconRepeat()}
          />

        </div>
      </section>

      {/* --------------------- CONTENIDO --------------------- */}
      <main className="flex-1 px-6 py-6 pb-24">
        <Outlet />
      </main>

      {/* --------------------- MENÚ INFERIOR --------------------- */}
      <footer className="fixed bottom-0 left-0 w-full bg-white shadow-inner border-t 
        flex justify-between md:justify-center px-4 md:px-10 gap-6 md:gap-12 py-3">

        {/* Salidas → ADMIN + DEV + JEFE */}
        {(esAdmin || esJefe) && (
          <MenuItem to="/salidas" icon={repeatIcon()} label="Salidas" />
        )}

        {/* Entradas → SOLO ADMIN + DEV */}
        {esAdmin && (
          <MenuItem to="/entradas" icon={packageIcon()} label="Entradas" />
        )}

        {/* Inventario → TODOS */}
        <MenuItem to="/inventario" icon={clipboardIcon()} label="Inventario" />

        {/* Historial → TODOS */}
        <MenuItem to="/historial" icon={historyIcon()} label="Historial" />

        {/* Empleados → SOLO ADMIN + DEV */}
        {esAdmin && (
          <MenuItem to="/empleados" icon={userIcon()} label="Empleados" />
        )}

      </footer>

      {/* --------------------- MODAL NUEVO REPUESTO --------------------- */}
      <ModalNuevoRepuesto
        abierto={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onCreated={() => {}}
      />

    </div>
  );
}

/* ---------------------- COMPONENTES ---------------------- */
function TopButton({ icon, label, primary, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg flex items-center gap-2 border transition
      ${primary ? "bg-gray-600 text-white hover:bg-gray-700"
        : "bg-gray-100 hover:bg-gray-200 text-slate-700"}`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function MenuItem({ to, icon, label }: any) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 text-sm transition 
        ${isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

/* ---------------------- TARJETAS MEJORADAS ---------------------- */
function DashboardCard({ title, value, subtitle, color, icon }: any) {
  // 👇 Tailwind detectará estas clases porque están escritas literalmente
  const bg =
    color === "green"
      ? "bg-green-100"
      : color === "yellow"
      ? "bg-yellow-100"
      : "";

  const border =
    color === "green"
      ? "border-green-300"
      : color === "yellow"
      ? "border-yellow-300"
      : "";

  const text =
    color === "green"
      ? "text-green-800"
      : color === "yellow"
      ? "text-yellow-800"
      : "";

  const iconBg =
    color === "green"
      ? "bg-green-300"
      : color === "yellow"
      ? "bg-yellow-300"
      : "";

  return (
    <div
      className={`
        ${bg} ${border}
        rounded-2xl p-6 flex justify-between items-center
        border shadow-[0_4px_15px_rgba(0,0,0,0.07)]
        transition-all duration-300 
        hover:shadow-[0_6px_22px_rgba(0,0,0,0.12)]
        hover:-translate-y-1
      `}
    >
      <div>
        <h3 className={`text-sm font-semibold ${text}`}>{title}</h3>

        <p className="text-4xl font-bold text-gray-900 mt-1">
          {value}
        </p>

        <p className={`${text} text-sm mt-1`}>{subtitle}</p>
      </div>

      <div className={`${iconBg} p-4 rounded-2xl`}>
        {icon}
      </div>
    </div>
  );
}

/* ---------------------- ICONOS SVG ---------------------- */
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
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" strokeLinecap="round"/>
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
}