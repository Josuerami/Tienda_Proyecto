const express = require('express');
const ctrl = require('../controladores/authControlador');

const router = express.Router();

// Formularios
router.get('/login', ctrl.formLogin);
router.get('/registro', ctrl.formRegistro);

// Acciones
router.post('/login', ctrl.ingresar);
router.post('/registro', ctrl.registrar);
router.post('/salir', ctrl.salir);

router.get('/cuenta', ctrl.verCuenta);
router.post('/cuenta/editar', ctrl.editarCuenta);
router.post('/cuenta/eliminar', ctrl.eliminarCuenta);

module.exports = router;
