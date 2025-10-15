export interface VentaSummary {
  id: number;
  fecha: Date;
  total: number;
  usuarioId: number | null;
  clienteId: number | null;
  usuario_nombre: string | null;
  cliente_dni: string | null;
  cliente_nombre: string | null;
  total_items: number;
}

export interface VentaWithDetails {
  id: number;
  fecha: Date;
  total: number;
  usuarioId: number | null;
  clienteId: number | null;
  usuario: {
    username: string;
  } | null;
  cliente: {
    dni: string;
    nombre: string | null;
    apellidoPaterno: string | null;
    apellidoMaterno: string | null;
  } | null;
  detalleVenta: {
    id: number;
    cantidad: number;
    precioUnitario: any;
    subtotal: any;
    medicamento: {
      nombre: string;
      categoria: string | null;
      precio: any;
    };
  }[];
  usuario_nombre: string | null;
  cliente_dni: string | null;
  cliente_nombre: string | null;
  cliente_apellido_paterno: string | null;
  cliente_apellido_materno: string | null;
  cliente_nombre_completo: string | null;
  detalles: {
    id: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    medicamento_nombre: string;
    categoria: string;
    precio_unitario: number;
  }[];
}

export interface VentaStats {
  total_ventas: number;
  total_ingresos: number;
  promedio_venta: number;
  ventas_hoy: number;
  ingresos_hoy: number;
}

export interface StockVerificationResult {
  disponible: boolean;
  errores: {
    medicamento_id: number;
    error: string;
    nombre?: string;
    stock_disponible?: number;
    cantidad_solicitada?: number;
  }[];
}

export interface BoletaData {
  venta_id: number;
  total: number;
  fecha: Date;
  usuario_nombre: string;
  items: {
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[];
  cliente?: {
    dni: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    nombre_completo: string;
  } | null;
}

export interface CreateVentaResult {
  venta_id: number;
  total: number;
  fecha: Date;
  items: number;
  cliente: {
    dni: string;
    nombre?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
  } | null;
}
