import { useAuth } from '../context/AuthContext'


export default function Header() {
const { usuario, logout } = useAuth()


return (
<header
style={{
display: 'flex',
justifyContent: 'space-between',
padding: '1rem 1.5rem',
borderBottom: '1px solid #e5e7eb',
}}
>
<h3>Inventario Empresarial</h3>


<div>
<strong>{usuario?.nombre}</strong> · {usuario?.rol}
<button
onClick={logout}
style={{ marginLeft: '1rem' }}
>
Salir
</button>
</div>
</header>
)
}