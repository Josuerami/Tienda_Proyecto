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
      return res.render('auth/login', {
        titulo: 'Iniciar sesión',
        error: 'Usuario no encontrado'
      });
    }

    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido) {
      return res.render('auth/login', {
        titulo: 'Iniciar sesión',
        error: 'Contraseña incorrecta'
      });
    }

    req.session.usuario = usuario;
    req.session.rol = usuario.rol;

    res.render('auth/bienvenido', {
      titulo: 'Bienvenido',
      nombre: usuario.nombre
    });

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
      return res.render('auth/registro', {
        titulo: 'Registro',
        error: 'Faltan campos obligatorios'
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const usuario = await Usuario.crear({
      nombre,
      apellido_paterno,
      apellido_materno,
      email,
      password_hash: hash,
      rol: 'cliente'
    });

    req.session.usuario = usuario;
    req.session.rol = 'cliente';

    res.render('auth/bienvenido', {
      titulo: 'Bienvenido',
      nombre
    });

  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).send('Error interno al registrar');
  }
};

exports.verCuenta = async (req, res) => {
  res.render('auth/cuenta', {
    titulo: 'Mi cuenta',
    usuario: req.session.usuario
  });
};

exports.editarCuenta = async (req, res) => {
  const { nombre, apellido_paterno, apellido_materno } = req.body;

  await Usuario.actualizar(req.session.usuario.id, {
    nombre,
    apellido_paterno,
    apellido_materno
  });

  req.session.usuario.nombre = nombre;
  req.session.usuario.apellido_paterno = apellido_paterno;
  req.session.usuario.apellido_materno = apellido_materno;

  res.redirect('/auth/cuenta');
};

exports.eliminarCuenta = async (req, res) => {
  await Usuario.eliminar(req.session.usuario.id);
  req.session.destroy(() => res.redirect('/'));
};

exports.salir = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};
