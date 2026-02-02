// =========================
// Tipos generales
// =========================

export interface Repuesto {
  id: string;
  codigo_corto?: string;
  nombre: string;
  unidad: string;
  stock_minimo: number;
}

export interface StockActual {
  repuesto_id: string;
  codigo_corto: string;
  nombre: string;
  unidad: string;
  stock: number;
  stock_minimo: number;
}

export interface Empleado {
  id: string;
  nombre: string;
  area?: string;
}

export interface Movimiento {
  id: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  creado_en?: string;
  created_at: string;

  repuestos?: {
    id: string;
    nombre: string;
    unidad: string;
  };

  empleado_entrega?: {
    id: string;
    nombre: string;
  };

  empleado_recibe?: {
    id: string;
    nombre: string;
  };
}

// =========================
// Tipos DTO (para crear)
// =========================

export interface CrearEmpleadoDTO {
  nombre: string;
  cargo: string;
}

export interface CrearRepuestoDTO {
  nombre: string;
  unidad: string;
  stock_minimo: number;
  cantidad_inicial: number;
  usuario_id: string;
}

export interface CrearEntradaDTO {
  repuesto_id: string;
  cantidad: number;
  recibido_por: string;
  notas: string;
  usuario_id: string;
}

export interface CrearSalidaDTO {
  repuesto_id: string;
  cantidad: number;
  entregado_por: string;
  recibido_por: string;
  notas: string;
  usuario_id: string;
}

// =========================
// Usuario desde tabla "users"
// =========================

export interface UsuarioApp {
  id: string;
  nombre: string;
  email: string;
  rol_usuario: string;
  area?: string | null;
}