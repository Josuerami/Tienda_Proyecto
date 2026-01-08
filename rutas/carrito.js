const express = require('express');
const router = express.Router();
const Producto = require('../modelos/Producto');
const PDFDocument = require('pdfkit'); // librería para generar PDF

// ✅ Middleware para exigir login
function requireLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.render('tienda/mensaje', {
      titulo: 'Inicia sesión',
      mensaje: 'Debes iniciar sesión para continuar con tu compra.',
      enlace: '/auth/login',
      textoEnlace: 'Ir a iniciar sesión'
    });
  }
  next();
}

// Agregar producto al carrito (solo si está logueado)
router.post('/carrito/agregar/:id', requireLogin, async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const producto = await Producto.porId(id);
    if (!producto) {
      return res.redirect('/productos');
    }

    if (!req.session.carrito) {
      req.session.carrito = [];
    }

    const item = req.session.carrito.find(p => p.id === id);
    if (item) {
      item.cantidad += 1;
    } else {
      req.session.carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1
      });
    }

    res.redirect('/carrito');
  } catch (err) {
    console.error('Error al agregar al carrito:', err);
    res.redirect('/productos');
  }
});

// Mostrar carrito (requiere login)
router.get('/carrito', requireLogin, (req, res) => {
  res.render('tienda/carrito', {
    titulo: 'Carrito',
    carrito: req.session.carrito || []
  });
});

// Eliminar producto del carrito (requiere login)
router.post('/carrito/eliminar/:id', requireLogin, (req, res) => {
  const id = parseInt(req.params.id);
  req.session.carrito = (req.session.carrito || []).filter(p => p.id !== id);
  res.redirect('/carrito');
});

// Finalizar compra (checkout, requiere login)
router.get('/carrito/checkout', requireLogin, (req, res) => {
  const carrito = req.session.carrito || [];

  if (carrito.length === 0) {
    return res.render('tienda/checkout', {
      titulo: 'Finalizar compra',
      mensaje: 'Tu carrito está vacío',
      carrito: [],
      total: 0
    });
  }

  const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  res.render('tienda/checkout', {
    titulo: 'Finalizar compra',
    carrito,
    total
  });
});

// Confirmar compra (requiere login)
router.post('/carrito/confirmar', requireLogin, (req, res) => {
  const carrito = req.session.carrito || [];
  const { nombre_completo, metodo_pago } = req.body;

  if (carrito.length === 0) {
    return res.render('tienda/checkout', {
      titulo: 'Finalizar compra',
      mensaje: 'Tu carrito está vacío',
      carrito: [],
      total: 0
    });
  }

  const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  // Guardar datos en sesión para el ticket
  req.session.ticket = { nombre_completo, metodo_pago, carrito, total };

  // Vaciar carrito después de confirmar
  req.session.carrito = [];

  res.render('tienda/confirmacion', {
    titulo: 'Compra realizada',
    nombre_completo,
    metodo_pago,
    total
  });
});

// Descargar ticket en PDF (requiere login)
router.get('/carrito/ticket', requireLogin, (req, res) => {
  const ticket = req.session.ticket;
  if (!ticket) {
    return res.redirect('/productos');
  }

  const { nombre_completo, metodo_pago, carrito, total } = ticket;

  const doc = new PDFDocument();
  res.setHeader('Content-Disposition', 'attachment; filename="ticket.pdf"');
  res.setHeader('Content-Type', 'application/pdf');

  doc.pipe(res);

  doc.fontSize(18).text('Tienda Canelitos - Ticket de compra', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Cliente: ${nombre_completo}`);
  doc.text(`Método de pago: ${metodo_pago}`);
  doc.text(`Fecha: ${new Date().toLocaleString()}`);
  doc.moveDown();

  carrito.forEach(item => {
    doc.text(`${item.cantidad} x ${item.nombre} - $${(item.precio * item.cantidad).toFixed(2)}`);
  });

  doc.moveDown();
  doc.fontSize(14).text(`Total pagado: $${total.toFixed(2)}`, { align: 'right' });

  doc.end();
});

module.exports = router;
