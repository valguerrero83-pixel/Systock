import { Link } from "react-router-dom"

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <Link to="/app/dashboard">Dashboard</Link>
      <Link to="/app/historial">Historial</Link>
      <Link to="/app/entradas">Entradas</Link>
      <Link to="/app/salidas">Salidas</Link>
      <Link to="/app/repuestos">Repuestos</Link>
      <Link to="/app/empleados">Empleados</Link>
    </nav>
  )
}