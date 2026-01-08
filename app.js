const path = require('path');
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const bodyParser = require('body-parser');

// Importar rutas
const rutasComunes = require('./rutas/comunes');
const rutasTienda = require('./rutas/tienda');
const rutasAuth = require('./rutas/auth');
const rutasAdmin = require('./rutas/admin');
const rutasVendedor = require('./rutas/vendedor');
const rutasCarrito = require('./rutas/carrito'); // ✅ nuevo

const app = express();
const PORT = process.env.PORT || 3000; // permite usar variable de entorno o 3000 por defecto

// Motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vistas'));

// Middlewares
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'canelitos_super_secreto', // clave fija para sesiones
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
app.use('/auth', rutasAuth);
app.use('/admin', rutasAdmin);
app.use('/vendedor', rutasVendedor);
app.use('/', rutasCarrito); // ✅ ahora sí existe /carrito/agregar

// Página 404 (cuando no se encuentra la ruta)
app.use((req, res) => {
  res.status(404).render('tienda/404', { titulo: 'Página no encontrada' });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`✅ Tienda Canelitos corriendo en http://localhost:${PORT}`);
});
