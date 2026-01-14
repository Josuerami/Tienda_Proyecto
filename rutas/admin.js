const express = require('express');
const ctrl = require('../controladores/adminControlador');

const router = express.Router();

function esAdmin(req, res, next) {
  if (req.session.rol === 'admin') return next();
  return res.redirect('/');
}

function esAdminOVendedor(req, res, next) {
  if (req.session.rol === 'admin' || req.session.rol === 'vendedor') return next();
  return res.redirect('/');
}

router.get('/', esAdmin, ctrl.panel);
router.get('/productos', esAdminOVendedor, ctrl.listarProductos);
router.get('/productos/agregar', esAdminOVendedor, ctrl.formAgregarProducto);
router.post('/productos/agregar', esAdminOVendedor, ctrl.middlewareSubida, ctrl.agregarProducto); // AQUÍ SUBES LA IMAGEN
// Editar producto
router.get('/productos/editar/:id', esAdminOVendedor, ctrl.formEditarProducto);
router.post('/productos/editar/:id', esAdminOVendedor, ctrl.middlewareSubida, ctrl.editarProducto);
// Eliminar producto
router.post('/productos/eliminar', esAdminOVendedor, ctrl.eliminarProducto);

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

// Rutas para gestión de reseñas (solo admin)
router.get('/resenas', esAdmin, ctrl.listarResenas);
router.post('/resenas/eliminar', esAdmin, ctrl.eliminarResena);
router.post('/resenas/resuelta', esAdmin, ctrl.marcarResuelta);

// Rutas para gestión de usuarios (solo admin)
router.get('/usuarios', esAdmin, ctrl.listarUsuarios);
router.get('/usuarios/:id', esAdmin, ctrl.verUsuario);
router.post('/usuarios/eliminar', esAdmin, ctrl.eliminarUsuario);

module.exports = router;
