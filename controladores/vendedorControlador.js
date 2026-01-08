const Orden = require('../modelos/Orden');
const Ticket = require('../modelos/Ticket');
const db = require('../config/db');

exports.panel = async (req, res) => {
  const [[row]] = await db.query('SELECT SUM(total) AS total, COUNT(*) AS tickets FROM pedidos WHERE DATE(creado_en) = CURDATE()');
  res.render('vendedor/panel', { titulo: 'Vendedor', ventasDelDia: row.total || 0, tickets: row.tickets || 0 });
};

exports.checkout = (req, res) => {
  const carrito = req.session.carrito || [];
  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  res.render('vendedor/checkout', { titulo: 'Confirmar compra', carrito, total });
};

exports.procesarCheckout = async (req, res) => {
  const carrito = req.session.carrito || [];
  if (!carrito.length) return res.redirect('/vendedor/checkout');
  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const { nombre_completo, metodo_pago } = req.body;
  const ordenId = await Orden.crearOrden({ usuario_id: null, metodo_pago, nombre_completo, total, estado: 'pending' });
  for (const item of carrito) {
    await Orden.agregarItem({ pedido_id: ordenId, producto_id: item.producto_id, cantidad: item.cantidad, precio_unitario: item.precio });
  }
  await Ticket.emitir(ordenId);
  req.session.carrito = [];
  res.redirect(`/ticket/${ordenId}`);
};

exports.calendario = async (req, res) => {
  res.render('vendedor/calendario', { titulo: 'Calendario Ganancias' });
};

exports.resumen = async (req, res) => {
  const [[mes]] = await db.query('SELECT SUM(total) AS total FROM pedidos WHERE MONTH(creado_en) = MONTH(CURDATE())');
  const [[semana]] = await db.query('SELECT SUM(total) AS total FROM pedidos WHERE YEARWEEK(creado_en) = YEARWEEK(CURDATE())');
  const [items] = await db.query(`
    SELECT CONCAT(p.nombre, ' $', oi.precio_unitario) AS producto,
           SUM(oi.cantidad) AS cantidad,
           SUM(oi.cantidad * oi.precio_unitario) AS total
    FROM pedido_items oi
    JOIN productos p ON p.id = oi.producto_id
    GROUP BY oi.producto_id
    ORDER BY total DESC
    LIMIT 10
  `);
  res.render('vendedor/resumen', {
    titulo: 'Ventas realizadas',
    totalMes: mes.total || 0,
    totalSemana: semana.total || 0,
    items
  });
};
