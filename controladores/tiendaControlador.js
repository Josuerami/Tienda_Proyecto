const Producto = require('../modelos/Producto');
const Orden = require('../modelos/Orden');
const Ticket = require('../modelos/Ticket');
const db = require('../config/db');

// Página de inicio
exports.inicio = async (req, res) => {
  const productos = (req.session.rol === 'admin' || req.session.rol === 'vendedor') ? await Producto.todosAdmin() : await Producto.todos();
  res.render('tienda/inicio', { titulo: 'Tienda Canelitos', productos });
};

// Listar productos
exports.listarProductos = async (req, res) => {
  const { q } = req.query;
  const productos = (req.session.rol === 'admin' || req.session.rol === 'vendedor') ? await Producto.todosAdmin() : await Producto.todos(q || '');
  res.render('tienda/productos', { titulo: 'Productos', productos, q: q || '' });
};

// Detalle de producto
exports.detalleProducto = async (req, res) => {
  const { id } = req.params;
  const producto = (req.session.rol === 'admin' || req.session.rol === 'vendedor') ? await Producto.porIdAdmin(id) : await Producto.porId(id);
  if (!producto) return res.redirect('/productos');
  res.render('tienda/producto_detalle', { titulo: 'Producto', producto });
};

// Agregar al carrito
exports.agregarCarrito = async (req, res) => {
  const { producto_id, cantidad } = req.body;
  const producto = await Producto.porId(producto_id);
  if (!producto) return res.redirect('/productos');

  const qty = Number(cantidad) > 0 ? Number(cantidad) : 1;
  const carrito = req.session.carrito || [];
  const existente = carrito.find(i => i.producto_id == producto.id);

  if (existente) {
    existente.cantidad += qty;
  } else {
    carrito.push({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: qty
    });
  }

  req.session.carrito = carrito;
  res.redirect('/carrito');
};

// Vaciar carrito
exports.vaciarCarrito = (req, res) => {
  req.session.carrito = [];
  res.redirect('/carrito');
};

// Ver carrito
exports.verCarrito = (req, res) => {
  const carrito = req.session.carrito || [];
  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  res.render('tienda/carrito', { titulo: 'Carrito', carrito, total });
};

// Checkout
exports.checkout = (req, res) => {
  const carrito = req.session.carrito || [];
  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  res.render('tienda/checkout', { titulo: 'Confirmar compra', carrito, total });
};

// Procesar checkout
exports.procesarCheckout = async (req, res) => {
  const carrito = req.session.carrito || [];
  if (!carrito.length) return res.redirect('/carrito');

  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const { nombre_completo, metodo_pago } = req.body;

  const ordenId = await Orden.crearOrden({
    usuario_id: req.session.usuario ? req.session.usuario.id : null,
    metodo_pago,
    nombre_completo,
    total,
    estado: 'pending'
  });

  for (const item of carrito) {
    await Orden.agregarItem({
      pedido_id: ordenId,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio
    });
  }

  await Ticket.emitir(ordenId);
  req.session.carrito = [];
  res.redirect(`/ticket/${ordenId}`);
};

// Ticket
exports.ticket = async (req, res) => {
  const { id } = req.params;
  const { pedido, items } = await Orden.porId(id);
  res.render('tienda/ticket', { titulo: 'Ticket', pedido, items });
};

// Acerca
exports.acerca = (req, res) => {
  res.render('tienda/acerca', { titulo: 'Acerca de' });
};

// Contacto (formulario)
exports.contacto = (req, res) => {
  const ok = !!req.query.ok;
  res.render('tienda/contacto', { titulo: 'Contáctanos', ok });
};

// Guardar contacto (corregido)
exports.guardarContacto = async (req, res) => {
  const { nombre, email, mensaje } = req.body;

  try {
    await db.query(
      'INSERT INTO contactos (nombre, email, mensaje) VALUES (?,?,?)',
      [nombre, email, mensaje]
    );
    res.redirect('/contacto?ok=1');
  } catch (err) {
    console.error('Error al guardar contacto:', err);
    res.render('tienda/mensaje', {
      titulo: 'Error',
      mensaje: 'No se pudo enviar tu mensaje.',
      enlace: '/contacto',
      textoEnlace: 'Volver al formulario'
    });
  }
};

// Perfil
exports.perfil = (req, res) => {
  res.render('tienda/perfil', { titulo: 'Perfil' });
};
