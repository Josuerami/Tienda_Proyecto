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
})();

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`✅ Tienda Canelitos corriendo en http://localhost:${PORT}`);
});
