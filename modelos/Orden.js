const db = require('../config/db');

module.exports = {
  async crearOrden({ usuario_id = null, metodo_pago = 'Efectivo', nombre_completo, total, estado = 'pending' }) {
    const [res] = await db.query(
      'INSERT INTO pedidos (usuario_id, metodo_pago, nombre_completo, total, estado) VALUES (?,?,?,?,?)',
      [usuario_id, metodo_pago, nombre_completo, total, estado]
    );
    return res.insertId;
  },
  async agregarItem({ pedido_id, producto_id, cantidad, precio_unitario }) {
    await db.query(
      'INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?,?,?,?)',
      [pedido_id, producto_id, cantidad, precio_unitario]
    );
  },
  async porId(id) {
    const [[pedido]] = await db.query('SELECT * FROM pedidos WHERE id = ?', [id]);
    const [items] = await db.query(
      'SELECT oi.*, p.nombre FROM pedido_items oi JOIN productos p ON p.id = oi.producto_id WHERE pedido_id = ?',
      [id]
    );
    return { pedido, items };
  },
  async listarRecientes() {
    const [rows] = await db.query('SELECT * FROM pedidos ORDER BY creado_en DESC');
    return rows;
  },
  async eliminar(id) {
    await db.query('DELETE FROM pedido_items WHERE pedido_id = ?', [id]);
    await db.query('DELETE FROM pedidos WHERE id = ?', [id]);
  }
};
