const bcrypt = require('bcrypt');
const Producto = require('../modelos/Producto');
const Categoria = require('../modelos/Categoria');
const Inventario = require('../modelos/Inventario');
const Empleado = require('../modelos/Empleado');
const Orden = require('../modelos/Orden');
const Ticket = require('../modelos/Ticket');
const db = require('../config/db');
const path = require('path');
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
  const ruta_imagen = req.file ? path.join('publico', 'uploads', req.file.filename) : null; // AQUÍ VA LA IMAGEN
  await Producto.crear({ nombre, descripcion, precio, categoria_id, ruta_imagen, stock, marca, proveedor, fecha_registro, activo: 1 });
  res.redirect('/admin');
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
