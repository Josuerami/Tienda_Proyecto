const db = require('../config/db');

module.exports = {
  async todos() {
    const [rows] = await db.query(
      'SELECT i.*, p.nombre AS nombre_producto FROM inventario i JOIN productos p ON p.id = i.producto_id ORDER BY i.id DESC'
    );
    return rows;
  },
  async crear({ producto_id, unidades_exhibicion, fecha_compra, estado = 'Completed' }) {
    const [res] = await db.query(
      'INSERT INTO inventario (producto_id, unidades_exhibicion, fecha_compra, estado) VALUES (?,?,?,?)',
      [producto_id, unidades_exhibicion, fecha_compra, estado]
    );
    return res.insertId;
  },
  async consultarPorNombre(nombre) {
    const [rows] = await db.query(
      'SELECT p.id, p.nombre, p.precio, p.stock FROM productos p WHERE p.nombre LIKE ?',
      [`%${nombre}%`]
    );
    return rows;
  },
  async actualizarStock({ producto_id, stock }) {
    await db.query('UPDATE productos SET stock = ? WHERE id = ?', [stock, producto_id]);
  },
  async eliminarProducto(id) {
    await db.query('DELETE FROM productos WHERE id = ?', [id]);
  }
};
