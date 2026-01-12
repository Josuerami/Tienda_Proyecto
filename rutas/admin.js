const express = require('express');
const ctrl = require('../controladores/adminControlador');

const router = express.Router();

function esAdmin(req, res, next) {
  if (req.session.rol === 'admin') return next();
  return res.redirect('/');
}

router.get('/', esAdmin, ctrl.panel);
router.get('/productos/agregar', esAdmin, ctrl.formAgregarProducto);
router.post('/productos/agregar', esAdmin, ctrl.middlewareSubida, ctrl.agregarProducto); // AQUÍ SUBES LA IMAGEN
// Editar producto
router.get('/productos/editar/:id', esAdmin, ctrl.formEditarProducto);
router.post('/productos/editar/:id', esAdmin, ctrl.middlewareSubida, ctrl.editarProducto);
// Eliminar producto
router.post('/productos/eliminar', esAdmin, ctrl.eliminarProducto);

router.get('/empleados/agregar', esAdmin, ctrl.formAgregarEmpleado);
router.post('/empleados/agregar', esAdmin, ctrl.agregarEmpleado);
router.get('/empleados', esAdmin, ctrl.listarEmpleados);
router.get('/reportes/generar', esAdmin, ctrl.formReporte);
router.post('/reportes/generar', esAdmin, ctrl.generarReporte);
router.get('/inventario', esAdmin, ctrl.inventario);
router.post('/inventario/consultar', esAdmin, ctrl.inventarioConsultar);
router.post('/inventario/modificar', esAdmin, ctrl.inventarioModificar);
router.post('/inventario/eliminar', esAdmin, ctrl.inventarioEliminar);
router.get('/pedidos', esAdmin, ctrl.pedidos);
router.post('/pedidos/eliminar', esAdmin, ctrl.pedidosEliminar);

module.exports = router;
