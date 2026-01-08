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

module.exports = router;
