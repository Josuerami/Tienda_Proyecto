const express = require('express');
const ctrl = require('../controladores/tiendaControlador');

const router = express.Router();

router.get('/productos', ctrl.listarProductos);
router.get('/producto/:id', ctrl.detalleProducto);
router.get('/acerca', ctrl.acerca);
router.post('/acerca/enviar', ctrl.enviarResena);
router.post('/carrito/agregar', ctrl.agregarCarrito);
router.post('/carrito/vaciar', ctrl.vaciarCarrito);
router.get('/carrito', ctrl.verCarrito);
router.get('/checkout', ctrl.checkout);
router.post('/checkout', ctrl.procesarCheckout);
router.get('/ticket/:id', ctrl.ticket);
router.get('/perfil', ctrl.perfil);

module.exports = router;
