import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { usuario, logout } = useAuth()

  return (
    <header
      className="
        w-full
        border-b 
        border-gray-200 
        px-4 
        py-3 
        bg-white
        flex 
        flex-col 
        sm:flex-row 
        items-start 
        sm:items-center 
        justify-between
        gap-3
      "
    >
      {/* Título */}
      <h3 className="text-lg font-semibold text-gray-800">
        Inventario Empresarial
      </h3>

      {/* Usuario + Logout */}
      <div className="
        flex 
        items-center 
        gap-3 
        flex-wrap
        text-sm
      ">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-gray-700">
          <strong className="text-gray-900">{usuario?.nombre}</strong>
          <span className="text-gray-500">· {usuario?.rol_usuario}</span>
        </div>

        <button
          onClick={logout}
          className="
            bg-red-500 
            hover:bg-red-600 
            text-white 
            px-3 
            py-1.5 
            rounded-lg 
            shadow-sm 
            transition 
            text-sm
          "
        >
          Salir
        </button>
      </div>
    </header>
  )
}
