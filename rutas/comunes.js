const express = require('express');
const ctrl = require('../controladores/tiendaControlador');

const router = express.Router();

router.get('/', ctrl.inicio);
router.get('/acerca', ctrl.acerca);
router.get('/contacto', ctrl.contacto);
router.post('/contacto/enviar', ctrl.guardarContacto);

module.exports = router;
