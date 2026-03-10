
// Usuario de la aplicación (tabla users)
export interface UsuarioApp {
  id: string;
  nombre: string;
  email: string;
  rol_usuario: string;
  area?: string;
  created_at?: string;
}

// Empleados
export interface Empleado {
  id: string;
  nombre: string;
  cargo: string;
  total_movs: number;
  entradas: number;
  salidas: number;
  ultimo_mov: string | null;

  usuario?: {
    nombre: string;
    email: string;
  } | null;
}

// Repuestos
export interface Repuesto {
  id: string
  nombre: string
  unidad: string
  stock_minimo: number

  codigo_corto?: string
  codigo_siesa?: string
  categoria_id?: string

  categorias?: {
    id: string
    nombre: string
  }
}

// Movimiento (entradas/salidas)
export interface Movimiento {
  id: string;
  tipo: "entrada" | "salida";
  cantidad: number;

  // Usamos solo la fecha correcta del sistema
  created_at_tz: string;

  // columnas reales
  repuesto_id?: string | null;
  usuario_id?: string | null;
  notas?: string | null;
  entregado_por?: string | null;
  recibido_por?: string | null;

  // relaciones (joins)
  repuestos?: Repuesto | null;
  empleado_entrega?: Empleado | null;
  empleado_recibe?: Empleado | null;

  sedes?: {
    id: string;
    nombre: string;
  } | null;

  usuario?: {
  id: string
  nombre: string
  email?: string
} | null
}

// Inventario desde la vista stock_actual
export interface InventarioItem {
  repuesto_id: string;
  codigo_corto: string;
  nombre: string;
  unidad: string;
  stock: number;
  stock_minimo: number;
}

// DTOs
export interface CrearEmpleadoDTO {
  nombre: string;
  cargo: string;
}

export interface CrearEntradaDTO {
  repuesto_id: string;
  cantidad: number;
  recibido_por: string;
  notas?: string;
  usuario_id: string;
}

export interface CrearSalidaDTO {
  repuesto_id: string;
  cantidad: number;
  entregado_por: string;
  recibido_por: string;
  notas?: string;
  usuario_id: string;
}

export interface CrearRepuestoDTO {
  nombre: string;
  unidad: string;
  stock_minimo: number;
  cantidad_inicial: number;
  usuario_id: string;
}

export interface StockActual {
  repuesto_id: string;
  stock: number;
}