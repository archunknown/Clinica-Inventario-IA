-- Script de inicialización de base de datos para producción
-- Basado en el esquema actual de pgAdmin

-- Funciones
CREATE OR REPLACE FUNCTION public.actualizar_timestamp() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.marcar_medicamento_inactivo(medicamento_id integer) RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE medicamentos 
    SET activo = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = medicamento_id;
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.obtener_stock_bajo(limite_stock integer DEFAULT 20) 
RETURNS TABLE(id integer, nombre text, categoria text, stock integer, precio numeric)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT m.id, m.nombre, m.categoria, m.stock, m.precio
    FROM medicamentos m
    WHERE m.activo = true AND m.stock < limite_stock
    ORDER BY m.stock ASC, m.nombre ASC;
END;
$$;

-- Secuencias
CREATE SEQUENCE IF NOT EXISTS public.clientes_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.usuarios_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.medicamentos_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.ventas_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.detalle_venta_id_seq START 1;

-- Tablas
CREATE TABLE IF NOT EXISTS public.clientes (
    id integer PRIMARY KEY DEFAULT nextval('clientes_id_seq'),
    dni character varying(15) UNIQUE NOT NULL,
    nombre character varying(50),
    apellido_paterno character varying(50),
    apellido_materno character varying(50),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.usuarios (
    id integer PRIMARY KEY DEFAULT nextval('usuarios_id_seq'),
    username text UNIQUE NOT NULL,
    password text NOT NULL,
    rol text DEFAULT 'cajero'
);

CREATE TABLE IF NOT EXISTS public.medicamentos (
    id integer PRIMARY KEY DEFAULT nextval('medicamentos_id_seq'),
    nombre text NOT NULL,
    categoria text,
    descripcion text,
    stock integer NOT NULL,
    precio numeric(10,2) NOT NULL,
    unidad text DEFAULT 'unidades',
    activo boolean DEFAULT true,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.ventas (
    id integer PRIMARY KEY DEFAULT nextval('ventas_id_seq'),
    fecha timestamp DEFAULT CURRENT_TIMESTAMP,
    usuario_id integer,
    total numeric(10,2),
    cliente_id integer
);

CREATE TABLE IF NOT EXISTS public.detalle_venta (
    id integer PRIMARY KEY DEFAULT nextval('detalle_venta_id_seq'),
    venta_id integer NOT NULL,
    medicamento_id integer NOT NULL,
    cantidad integer NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    precio_unitario numeric(10,2) DEFAULT 0.00
);

-- Vistas
CREATE OR REPLACE VIEW public.vista_clientes_util AS
SELECT 
    id, dni, nombre, apellido_paterno, apellido_materno,
    concat(
        COALESCE(nombre, ''),
        CASE WHEN nombre IS NOT NULL AND (apellido_paterno IS NOT NULL OR apellido_materno IS NOT NULL) THEN ' ' ELSE '' END,
        COALESCE(apellido_paterno, ''),
        CASE WHEN apellido_paterno IS NOT NULL AND apellido_materno IS NOT NULL THEN ' ' ELSE '' END,
        COALESCE(apellido_materno, '')
    ) AS nombre_completo,
    created_at, updated_at
FROM public.clientes;

CREATE OR REPLACE VIEW public.vista_inventario_util AS
SELECT 
    id, nombre, categoria, descripcion, stock, precio, unidad,
    (stock::numeric * precio) AS valor_total,
    CASE
        WHEN stock < 20 THEN 'Bajo'
        WHEN stock <= 50 THEN 'Normal'
        ELSE 'Alto'
    END AS estado_stock
FROM public.medicamentos
WHERE activo = true
ORDER BY nombre;

CREATE OR REPLACE VIEW public.vista_ventas_util AS
SELECT 
    v.id, v.usuario_id, v.cliente_id, v.total, v.fecha,
    u.username AS usuario_nombre,
    c.dni AS cliente_dni,
    c.nombre AS cliente_nombre,
    c.apellido_paterno AS cliente_apellido_paterno,
    c.apellido_materno AS cliente_apellido_materno,
    concat(
        COALESCE(c.nombre, ''),
        CASE WHEN c.nombre IS NOT NULL AND (c.apellido_paterno IS NOT NULL OR c.apellido_materno IS NOT NULL) THEN ' ' ELSE '' END,
        COALESCE(c.apellido_paterno, ''),
        CASE WHEN c.apellido_paterno IS NOT NULL AND c.apellido_materno IS NOT NULL THEN ' ' ELSE '' END,
        COALESCE(c.apellido_materno, '')
    ) AS cliente_nombre_completo,
    count(dv.id) AS total_items
FROM public.ventas v
LEFT JOIN public.usuarios u ON v.usuario_id = u.id
LEFT JOIN public.clientes c ON v.cliente_id = c.id
LEFT JOIN public.detalle_venta dv ON v.id = dv.venta_id
GROUP BY v.id, u.username, c.dni, c.nombre, c.apellido_paterno, c.apellido_materno
ORDER BY v.fecha DESC;

-- Triggers
CREATE TRIGGER trigger_clientes_updated_at 
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();

CREATE TRIGGER trigger_medicamentos_updated_at 
BEFORE UPDATE ON public.medicamentos
FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();

-- Relaciones (Foreign Keys)
ALTER TABLE ONLY public.detalle_venta
ADD CONSTRAINT detalle_venta_medicamento_id_fkey FOREIGN KEY (medicamento_id) REFERENCES public.medicamentos(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.detalle_venta
ADD CONSTRAINT detalle_venta_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.ventas
ADD CONSTRAINT fk_ventas_cliente FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.ventas
ADD CONSTRAINT ventas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_dni ON public.clientes (dni);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre_completo ON public.clientes (nombre, apellido_paterno, apellido_materno);
CREATE INDEX IF NOT EXISTS idx_medicamentos_nombre ON public.medicamentos (nombre);
CREATE INDEX IF NOT EXISTS idx_medicamentos_categoria ON public.medicamentos (categoria);
CREATE INDEX IF NOT EXISTS idx_medicamentos_stock ON public.medicamentos (stock);
CREATE INDEX IF NOT EXISTS idx_medicamentos_activo ON public.medicamentos (activo);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas (fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario_id ON public.ventas (usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON public.ventas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_venta_id ON public.detalle_venta (venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_medicamento_id ON public.detalle_venta (medicamento_id);

-- Insertar usuario administrador por defecto (contraseña: admin123)
-- La contraseña debe ser hasheada con bcrypt en producción
INSERT INTO public.usuarios (username, password, rol) 
VALUES ('admin', '$2b$10$xQxGXxQxGXxQxGXxQxGXxO', 'administrador')
ON CONFLICT (username) DO NOTHING;
