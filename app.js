require('dotenv').config(); // ✅ carga las variables de entorno desde .env

const path = require('path');
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');

// Importar rutas
const rutasComunes = require('./rutas/comunes');
const rutasTienda = require('./rutas/tienda');
const rutasAuth = require('./rutas/auth');
const rutasAdmin = require('./rutas/admin');
const rutasVendedor = require('./rutas/vendedor');
const rutasCarrito = require('./rutas/carrito');

const app = express();
const PORT = process.env.PORT || 3000;

// Motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vistas'));

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'canelitos_super_secreto',
  resave: false,
  saveUninitialized: false
}));

// Archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'publico')));

// Inyecta variables globales en las vistas
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  res.locals.rol = req.session.rol || 'invitado';
  res.locals.carrito = req.session.carrito || [];
  res.locals.mensaje = req.session.mensaje || null;
  delete req.session.mensaje;
  next();
});

// Rutas principales
app.use('/', rutasComunes);
app.use('/', rutasTienda);
app.use('/', rutasCarrito);
app.use('/auth', rutasAuth);
app.use('/admin', rutasAdmin);
app.use('/vendedor', rutasVendedor);

// Página 404
app.use((req, res) => {
  res.status(404).render('tienda/404', { titulo: 'Página no encontrada' });
});

// Comprobar esquema (agregar columna vendedor_id si falta)
const db = require('./config/db');
(async () => {
  try {
    const [rows] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'vendedor_id'");
    if (!rows || rows.length === 0) {
      console.log('Añadiendo columna vendedor_id a productos...');
      await db.query('ALTER TABLE productos ADD COLUMN vendedor_id INT DEFAULT NULL');
      try {
        await db.query('ALTER TABLE productos ADD CONSTRAINT fk_productos_vendedor FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)');
      } catch (fkErr) {
        console.warn('No se pudo crear la FK vendedor -> usuarios:', fkErr.message);
      }
      console.log('Columna vendedor_id añadida');
    }
  } catch (err) {
    console.error('Error al comprobar o actualizar esquema:', err.message);
  }

  // Crear tabla resenas si no existe
  (async () => {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS resenas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT DEFAULT NULL,
          nombre VARCHAR(255),
          email VARCHAR(255),
          mensaje TEXT NOT NULL,
          producto_id INT DEFAULT NULL,
          resuelta TINYINT(1) DEFAULT 0,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('Tabla resenas OK');
    } catch (err) {
      console.error('Error creando tabla resenas:', err.message);
    }
  })();

  // Crear tabla carrito_items si no existe
  (async () => {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS carrito_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NOT NULL,
          producto_id INT NOT NULL,
          cantidad INT DEFAULT 1,
          fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY ux_usuario_producto (usuario_id, producto_id),
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
          FOREIGN KEY (producto_id) REFERENCES productos(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('Tabla carrito_items OK');
    } catch (err) {
      console.error('Error creando tabla carrito_items:', err.message);
    }
  })();

})();

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`✅ Tienda Canelitos corriendo en http://localhost:${PORT}`);
});
