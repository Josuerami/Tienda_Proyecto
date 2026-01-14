const db = require('../config/db');

module.exports = {
  async obtenerPorUsuario(usuario_id) {
    const [rows] = await db.query('SELECT ci.producto_id AS id, p.nombre, p.precio, ci.cantidad FROM carrito_items ci JOIN productos p ON p.id = ci.producto_id WHERE ci.usuario_id = ?', [usuario_id]);
    return rows;
  },

  async agregarItem(usuario_id, producto_id, cantidad = 1) {
    // si existe actualiza cantidad, si no inserta
    const [rows] = await db.query('SELECT cantidad FROM carrito_items WHERE usuario_id = ? AND producto_id = ?', [usuario_id, producto_id]);
    if (rows && rows.length) {
      const nueva = rows[0].cantidad + Number(cantidad);
      const [res] = await db.query('UPDATE carrito_items SET cantidad = ? WHERE usuario_id = ? AND producto_id = ?', [nueva, usuario_id, producto_id]);
      return res.affectedRows ? res.affectedRows : 0;
    } else {
      const [res] = await db.query('INSERT INTO carrito_items (usuario_id, producto_id, cantidad) VALUES (?,?,?)', [usuario_id, producto_id, cantidad]);
      return res.insertId ? res.insertId : 0;
    }
  },

  async actualizarItem(usuario_id, producto_id, cantidad) {
    const [res] = await db.query('UPDATE carrito_items SET cantidad = ? WHERE usuario_id = ? AND producto_id = ?', [cantidad, usuario_id, producto_id]);
    return res && res.affectedRows ? res.affectedRows : 0;
  },

  async eliminarItem(usuario_id, producto_id) {
    const [res] = await db.query('DELETE FROM carrito_items WHERE usuario_id = ? AND producto_id = ?', [usuario_id, producto_id]);
    return res && res.affectedRows ? res.affectedRows : 0;
  },

  async vaciar(usuario_id) {
    const [res] = await db.query('DELETE FROM carrito_items WHERE usuario_id = ?', [usuario_id]);
    return res && res.affectedRows ? res.affectedRows : 0;
  }
};