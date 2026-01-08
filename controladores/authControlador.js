const bcrypt = require('bcrypt');
const Usuario = require('../modelos/Usuario');

// Mostrar formulario de login
exports.formLogin = (req, res) => {
  res.render('auth/login', { titulo: 'Iniciar sesión' });
};

// Procesar login
exports.ingresar = async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.buscarPorEmail(email);
    if (!usuario) {
      return res.render('auth/login', { titulo: 'Iniciar sesión', error: 'Usuario no encontrado' });
    }

    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido) {
      return res.render('auth/login', { titulo: 'Iniciar sesión', error: 'Contraseña incorrecta' });
    }

    req.session.usuario = usuario.nombre;
    req.session.rol = usuario.rol;
    res.redirect('/');
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).send('Error interno al iniciar sesión');
  }
};

// Mostrar formulario de registro
exports.formRegistro = (req, res) => {
  res.render('auth/registro', { titulo: 'Registro' });
};

// Procesar registro
exports.registrar = async (req, res) => {
  try {
    const { nombre, apellido_paterno, apellido_materno, email, password } = req.body;
    if (!nombre || !apellido_paterno || !email || !password) {
      return res.render('auth/registro', { titulo: 'Registro', error: 'Faltan campos obligatorios' });
    }

    const hash = await bcrypt.hash(password, 10);

    await Usuario.crear({
      nombre,
      apellido_paterno,
      apellido_materno,
      email,
      password_hash: hash,
      rol: 'cliente'
    });

    req.session.usuario = nombre;
    req.session.rol = 'cliente';
    res.redirect('/');
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).send('Error interno al registrar');
  }
};

// Cerrar sesión
exports.salir = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};
