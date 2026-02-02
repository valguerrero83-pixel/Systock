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
  area?: string;
  created_at?: string;
}

// Repuestos
export interface Repuesto {
  id: string;
  codigo_corto?: string;
  nombre: string;
  unidad: string;
  stock_minimo: number;
  created_at?: string;
}

// Movimiento (entradas/salidas)
export interface Movimiento {
  id: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  created_at: string;

  repuesto_id: string;
  empleado_entrega_id?: string | null;
  empleado_recibe_id?: string | null;
  registrado_por: string;

  repuestos?: Repuesto | null;
  empleado_entrega?: Empleado | null;
  empleado_recibe?: Empleado | null;
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