-- Esquema de la base de datos para Tienda Canelitos

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  apellido_paterno VARCHAR(255) NOT NULL,
  apellido_materno VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('cliente', 'vendedor', 'admin') DEFAULT 'cliente',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  activo TINYINT(1) DEFAULT 1
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  categoria_id INT,
  ruta_imagen VARCHAR(255),
  stock INT DEFAULT 0,
  marca VARCHAR(255),
  proveedor VARCHAR(255),
  fecha_registro DATE,
  activo TINYINT(1) DEFAULT 1,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  ruta_foto VARCHAR(255),
  edad INT,
  genero VARCHAR(10),
  contacto VARCHAR(255),
  fecha_contratacion DATE,
  clave_acceso VARCHAR(255),
  horario VARCHAR(255),
  password_hash VARCHAR(255),
  salario DECIMAL(10,2) DEFAULT 0
);

-- Tabla de órdenes (pedidos)
CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  total DECIMAL(10,2) DEFAULT 0,
  estado ENUM('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de items de orden
CREATE TABLE IF NOT EXISTS items_orden (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT,
  producto_id INT,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla de tickets
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT,
  numero_ticket VARCHAR(255) UNIQUE,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

-- Tabla de inventario
CREATE TABLE IF NOT EXISTS inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT,
  stock_actual INT DEFAULT 0,
  stock_minimo INT DEFAULT 0,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Insertar datos iniciales
INSERT INTO categorias (nombre, descripcion) VALUES
('Alimentos', 'Productos alimenticios'),
('Bebidas', 'Bebidas y refrescos'),
('Limpieza', 'Productos de limpieza'),
('Mascotas', 'Productos para mascotas');

INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, rol) VALUES
('Admin', 'Admin', '', 'admin@tienda.com', '$2b$10$examplehash', 'admin');
