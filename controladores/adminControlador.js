const bcrypt = require('bcrypt');
const Producto = require('../modelos/Producto');
const Categoria = require('../modelos/Categoria');
const Inventario = require('../modelos/Inventario');
const Empleado = require('../modelos/Empleado');
const Orden = require('../modelos/Orden');
const Ticket = require('../modelos/Ticket');
const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'publico', 'uploads')),
  filename: (req, file, cb) => {
    const nombre = Date.now() + '_' + file.originalname.replace(/\s+/g, '_');
    cb(null, nombre);
  }
});
const subirImagen = multer({ storage: almacenamiento });

exports.middlewareSubida = subirImagen.single('imagen');

exports.panel = async (req, res) => {
  const [[sumas]] = await db.query('SELECT SUM(total) AS ventas, COUNT(*) AS tickets FROM pedidos WHERE DATE(creado_en) = CURDATE()');
  const ticketsHoy = await Ticket.contarHoy();
  const [[vendors]] = await db.query("SELECT COUNT(*) AS v FROM usuarios WHERE rol='vendedor'");
  res.render('admin/panel', {
    titulo: 'Administrador',
    ventasDelDia: sumas.ventas || 0,
    ticketsDelDia: ticketsHoy || 0,
    vendedoresActivos: vendors.v || 0
  });
};

exports.formAgregarProducto = async (req, res) => {
  const categorias = await Categoria.todas();
  res.render('admin/producto_agregar', { titulo: 'Agregar producto', categorias });
};

exports.agregarProducto = async (req, res) => {
  const { nombre, descripcion, precio, categoria_id, stock, marca, proveedor, fecha_registro } = req.body;
  const ruta_imagen = req.file ? req.file.filename : null; // guardamos solo el nombre del archivo
  const vendedor_id = req.session.usuario ? req.session.usuario.id : null;
  await Producto.crear({ nombre, descripcion, precio, categoria_id, ruta_imagen, stock, marca, proveedor, fecha_registro, activo: 1, vendedor_id });
  res.redirect('/admin/productos');
};

// Mostrar formulario de edición de producto
exports.formEditarProducto = async (req, res) => {
  const { id } = req.params;
  const producto = await Producto.porIdAdmin(id);
  if (!producto) return res.redirect('/admin');
  // Si es vendedor, verificar que sea propietario
  if (req.session.rol === 'vendedor' && producto.vendedor_id && producto.vendedor_id !== req.session.usuario.id) return res.redirect('/admin/productos');
  const categorias = await Categoria.todas();
  res.render('admin/producto_editar', { titulo: 'Editar producto', producto, categorias });
};

// Procesar edición de producto
exports.editarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('editarProducto called for id=', id, 'body=', req.body, 'file=', req.file ? req.file.filename : null, 'session=', req.session && req.session.usuario ? req.session.usuario.id : null);
    const { nombre, descripcion, precio, categoria_id, stock, marca, proveedor, fecha_registro } = req.body;
    const producto = await Producto.porIdAdmin(id);
    if (!producto) return res.redirect('/admin');
    if (req.session.rol === 'vendedor' && producto.vendedor_id && producto.vendedor_id !== req.session.usuario.id) return res.redirect('/admin/productos');
    const ruta_imagen = req.file ? req.file.filename : (producto.ruta_imagen ? path.basename(producto.ruta_imagen) : null);
    // Si sube una nueva imagen, borrar la anterior
    if (req.file && producto.ruta_imagen) {
      try {
        const viejoNombre = path.basename(producto.ruta_imagen);
        const rutaArchivoViejo = path.join(__dirname, '..', 'publico', 'uploads', viejoNombre);
        await fs.promises.unlink(rutaArchivoViejo);
      } catch (e) {
        console.warn('No se pudo eliminar imagen vieja:', e.message || e);
      }
    }
    const updated = await Producto.actualizar(id, { nombre, descripcion, precio, categoria_id, ruta_imagen, stock, marca, proveedor, fecha_registro });
    console.log('Producto.actualizar result=', updated);
    res.redirect('/admin/productos');
  } catch (err) {
    console.error('Error editarProducto', err);
    res.status(500).send('Error al actualizar producto');
  }
};

// Eliminar producto permanentemente (borrado físico)
exports.eliminarProducto = async (req, res) => {
  try {
    const producto_id = Number(req.body.producto_id);
    console.log('eliminarProducto called producto_id=', producto_id, 'session=', req.session && req.session.usuario ? req.session.usuario.id : null);
    const producto = await Producto.porIdAdmin(producto_id);
    if (!producto) return res.redirect('/admin/productos');
    if (req.session.rol === 'vendedor' && producto.vendedor_id && producto.vendedor_id !== req.session.usuario.id) return res.redirect('/admin/productos');

    const deleted = await Producto.eliminarPermanente(producto_id);
    console.log('Producto.eliminarPermanente result=', deleted);

    if (deleted && deleted > 0) {
      // Borrar archivo de imagen si existe
      if (producto.ruta_imagen) {
        try {
          const nombreArchivo = path.basename(producto.ruta_imagen);
          const rutaArchivo = path.join(__dirname, '..', 'publico', 'uploads', nombreArchivo);
          await fs.promises.unlink(rutaArchivo);
          console.log('Imagen eliminada:', rutaArchivo);
        } catch (e) {
          console.warn('No se pudo eliminar imagen del producto:', e.message || e);
        }
      }
      return res.redirect('/admin/productos');
    }

    // Si no se eliminó físicamente, hacer soft delete como fallback
    console.warn('No se eliminaron filas (id=', producto_id, '), aplicando soft delete como fallback');
    await Producto.eliminar(producto_id);
    res.redirect('/admin/productos');
  } catch (err) {
    console.error('Error eliminarProducto', err);
    res.status(500).send('Error al eliminar producto');
  }
};



// Listar productos (panel administrador)
exports.listarProductos = async (req, res) => {
  const productos = await Producto.todosAdmin();
  res.render('admin/productos', { titulo: 'Productos', productos });
};

// Restaurar producto (volver a activo)
exports.restaurarProducto = async (req, res) => {
  const { producto_id } = req.body;
  const producto = await Producto.porIdAdmin(producto_id);
  if (!producto) return res.redirect('/admin/productos');
  if (req.session.rol === 'vendedor' && producto.vendedor_id && producto.vendedor_id !== req.session.usuario.id) return res.redirect('/admin/productos');
  await Producto.restaurar(producto_id);
  res.redirect('/admin/productos');
};

exports.formAgregarEmpleado = (req, res) => {
  res.render('admin/empleado_agregar', { titulo: 'Agregar Empleados' });
};

exports.agregarEmpleado = async (req, res) => {
  const { nombre, apellido, edad, genero, contacto, fecha_contratacion, clave_acceso, horario, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await Empleado.crear({ nombre, apellido, ruta_foto: null, edad, genero, contacto, fecha_contratacion, clave_acceso, horario, password_hash: hash, salario: 0 });
  res.redirect('/admin/empleados');
};

exports.listarEmpleados = async (req, res) => {
  const empleados = await Empleado.todos();
  res.render('admin/empleados', { titulo: 'Empleados Activos', empleados });
};

exports.formReporte = async (req, res) => {
  const categorias = await Categoria.todas();
  res.render('admin/reporte_generar', { titulo: 'Generar reporte de venta', categorias });
};

exports.generarReporte = async (req, res) => {
  // Lugar para persistir reporte si lo deseas
  res.redirect('/admin');
};

exports.inventario = async (req, res) => {
  const inventario = await Inventario.todos();
  res.render('admin/inventario', { titulo: 'Inventario', inventario, consulta: null });
};

exports.inventarioConsultar = async (req, res) => {
  const { nombre } = req.body;
  const consulta = await Inventario.consultarPorNombre(nombre || '');
  const inventario = await Inventario.todos();
  res.render('admin/inventario', { titulo: 'Inventario', inventario, consulta });
};

exports.inventarioModificar = async (req, res) => {
  const { producto_id, stock } = req.body;
  await Inventario.actualizarStock({ producto_id, stock });
  res.redirect('/admin/inventario');
};

exports.inventarioEliminar = async (req, res) => {
  const { producto_id } = req.body;
  await Inventario.eliminarProducto(producto_id);
  res.redirect('/admin/inventario');
};

exports.pedidos = async (req, res) => {
  const pedidos = await Orden.listarRecientes();
  res.render('admin/pedido_lista', { titulo: 'Consulta de pedidos', pedidos });
};

exports.pedidosEliminar = async (req, res) => {
  const { pedido_id } = req.body;
  await Orden.eliminar(pedido_id);
  res.redirect('/admin/pedidos');
};

// --- Reseñas ---
exports.listarResenas = async (req, res) => {
  const Resena = require('../modelos/Resena');
  const resenas = await Resena.todas();
  res.render('admin/resenas', { titulo: 'Reseñas', resenas });
};

exports.eliminarResena = async (req, res) => {
  const Resena = require('../modelos/Resena');
  const { resena_id } = req.body;
  await Resena.eliminar(resena_id);
  res.redirect('/admin/resenas');
};

exports.marcarResuelta = async (req, res) => {
  const Resena = require('../modelos/Resena');
  const { resena_id } = req.body;
  await Resena.marcarResuelta(resena_id);
  res.redirect('/admin/resenas');
};

// --- Gestión de usuarios por administradores ---
exports.listarUsuarios = async (req, res) => {
  const Usuario = require('../modelos/Usuario');
  const usuarios = await Usuario.todos();
  res.render('admin/usuarios', { titulo: 'Usuarios', usuarios, usuario: req.session.usuario });
};

exports.verUsuario = async (req, res) => {
  const Usuario = require('../modelos/Usuario');
  const { id } = req.params;
  const usuario = await Usuario.buscarPorId(id);
  if (!usuario) return res.redirect('/admin/usuarios');
  res.render('admin/usuario_detalle', { titulo: 'Detalle de usuario', usuario, sesionUsuario: req.session.usuario });
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const Usuario = require('../modelos/Usuario');
    const { usuario_id } = req.body;
    const idNum = Number(usuario_id);

    // Evitar que el admin se elimine a sí mismo accidentalmente
    if (req.session.usuario && req.session.usuario.id === idNum) {
      return res.redirect('/admin/usuarios');
    }

    await Usuario.eliminar(idNum);
    res.redirect('/admin/usuarios');
  } catch (err) {
    console.error('Error eliminarUsuario', err);
    res.status(500).send('Error al eliminar usuario');
  }
};
