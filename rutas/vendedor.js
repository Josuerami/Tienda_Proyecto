const express = require('express');
const ctrl = require('../controladores/vendedorControlador');

const router = express.Router();

function esVendedor(req, res, next) {
  if (req.session.rol === 'vendedor' || req.session.rol === 'admin') return next();
  return res.redirect('/');
}

router.get('/', esVendedor, ctrl.panel);
router.get('/checkout', esVendedor, ctrl.checkout);
router.post('/checkout', esVendedor, ctrl.procesarCheckout);
router.get('/calendario', esVendedor, ctrl.calendario);
router.get('/resumen', esVendedor, ctrl.resumen);

module.exports = router;
