const db = require('../config/db');

module.exports = {
  async crear({ usuario_id = null, nombre = null, email = null, mensaje, producto_id = null }) {
    const [res] = await db.query(
      'INSERT INTO resenas (usuario_id, nombre, email, mensaje, producto_id) VALUES (?,?,?,?,?)',
      [usuario_id, nombre, email, mensaje, producto_id]
    );
    const [rows] = await db.query('SELECT * FROM resenas WHERE id = ? LIMIT 1', [res.insertId]);
    return rows[0];
  },

  async todas() {
    const [rows] = await db.query('SELECT r.*, u.email AS usuario_email FROM resenas r LEFT JOIN usuarios u ON u.id = r.usuario_id ORDER BY resuelta ASC, fecha_creacion DESC');
    return rows;
  },

  async porId(id) {
    const [rows] = await db.query('SELECT * FROM resenas WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async eliminar(id) {
    const [res] = await db.query('DELETE FROM resenas WHERE id = ?', [id]);
    return res && res.affectedRows ? res.affectedRows : 0;
  },

  async marcarResuelta(id) {
    const [res] = await db.query('UPDATE resenas SET resuelta = 1 WHERE id = ?', [id]);
    return res && res.affectedRows ? res.affectedRows : 0;
  }
};