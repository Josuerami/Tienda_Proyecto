const db = require('../config/db');

module.exports = {
  // Listar todos los productos (con búsqueda opcional)
  async todos(busqueda = '') {
    if (busqueda && busqueda.trim() !== '') {
      const [rows] = await db.query(
        `SELECT p.*, c.nombre AS nombre_categoria 
         FROM productos p 
         LEFT JOIN categorias c ON c.id = p.categoria_id 
         WHERE p.activo = 1 AND p.nombre LIKE ?`,
        [`%${busqueda}%`]
      );
      return rows;
    }
    const [rows] = await db.query(
      `SELECT p.*, c.nombre AS nombre_categoria 
       FROM productos p 
       LEFT JOIN categorias c ON c.id = p.categoria_id 
       WHERE p.activo = 1`
    );
    return rows;
  },

  // Buscar producto por ID (con categoría)
  async porId(id) {
    const [rows] = await db.query(
      `SELECT p.*, c.nombre AS nombre_categoria 
       FROM productos p 
       LEFT JOIN categorias c ON c.id = p.categoria_id 
       WHERE p.id = ? AND p.activo = 1`,
      [id]
    );
    return rows[0] || null;
  },

  // Crear producto nuevo
  async crear({ nombre, descripcion, precio, categoria_id, ruta_imagen, stock, marca, proveedor, fecha_registro, activo = 1 }) {
    const [res] = await db.query(
      `INSERT INTO productos 
       (nombre, descripcion, precio, categoria_id, ruta_imagen, stock, marca, proveedor, fecha_registro, activo) 
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        nombre,
        descripcion,
        precio,
        categoria_id,
        ruta_imagen || null,
        stock || 0,
        marca || null,
        proveedor || null,
        fecha_registro,
        activo
      ]
    );
    return res.insertId;
  },

  // Actualizar producto (campos dinámicos)
  async actualizar(id, fields) {
    const sets = [];
    const values = [];
    for (const key of Object.keys(fields)) {
      sets.push(`${key} = ?`);
      values.push(fields[key]);
    }
    if (sets.length === 0) return false;
    const sql = `UPDATE productos SET ${sets.join(', ')} WHERE id = ?`;
    values.push(id);
    await db.query(sql, values);
    return true;
  },

  // Eliminar producto (soft delete)
  async eliminar(id) {
    await db.query('UPDATE productos SET activo = 0 WHERE id = ?', [id]);
    return true;
  },

  // Actualizar stock
  async actualizarStock(id, stock) {
    await db.query('UPDATE productos SET stock = ? WHERE id = ?', [stock, id]);
    return true;
  }
};
