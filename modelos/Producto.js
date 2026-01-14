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

  // Listar todos los productos (para administrador, incluye inactivos)
  async todosAdmin() {
    const [rows] = await db.query(
      `SELECT p.*, c.nombre AS nombre_categoria 
       FROM productos p 
       LEFT JOIN categorias c ON c.id = p.categoria_id 
       ORDER BY p.id DESC`
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

  // Buscar producto por ID sin filtrar activo (para administrador)
  async porIdAdmin(id) {
    const [rows] = await db.query(
      `SELECT p.*, c.nombre AS nombre_categoria 
       FROM productos p 
       LEFT JOIN categorias c ON c.id = p.categoria_id 
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  // Crear producto nuevo
  async crear({ nombre, descripcion, precio, categoria_id, ruta_imagen, stock, marca, proveedor, fecha_registro, activo = 1, vendedor_id = null }) {
    const [res] = await db.query(
      `INSERT INTO productos 
       (nombre, descripcion, precio, categoria_id, ruta_imagen, stock, marca, proveedor, fecha_registro, activo, vendedor_id) 
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
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
        activo,
        vendedor_id
      ]
    );
    return res.insertId;
  },

  // Verifica si un usuario es propietario del producto (vendedor)
  async esPropietario(productoId, usuarioId) {
    const [rows] = await db.query('SELECT vendedor_id FROM productos WHERE id = ?', [productoId]);
    if (!rows || !rows[0]) return false;
    return rows[0].vendedor_id === usuarioId;
  },

  // Actualizar producto (campos dinámicos)
  async actualizar(id, fields) {
    const sets = [];
    const values = [];
    for (const key of Object.keys(fields)) {
      sets.push(`${key} = ?`);
      values.push(fields[key]);
    }
    if (sets.length === 0) return null;
    const sql = `UPDATE productos SET ${sets.join(', ')} WHERE id = ?`;
    values.push(id);
    const [res] = await db.query(sql, values);
    if (!(res && res.affectedRows)) return 0;
    const [rows] = await db.query('SELECT * FROM productos WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  // Eliminar producto permanentemente (borrado físico) usando transacción
  async eliminarPermanente(id) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Borrar dependencias conocidas si existen (silenciar tabla inexistente)
      try {
        await conn.query('DELETE FROM items_orden WHERE producto_id = ?', [id]);
      } catch (e) {
        if (e && e.code === 'ER_NO_SUCH_TABLE') console.warn('items_orden table missing, skipping'); else throw e;
      }
      try {
        await conn.query('DELETE FROM inventario WHERE producto_id = ?', [id]);
      } catch (e) {
        if (e && e.code === 'ER_NO_SUCH_TABLE') console.warn('inventario table missing, skipping'); else throw e;
      }

      // Eliminar producto
      const [res] = await conn.query('DELETE FROM productos WHERE id = ?', [id]);
      await conn.commit();
      console.log('Producto.eliminarPermanente (tx) id=', id, 'result=', res);
      return res && res.affectedRows ? res.affectedRows : 0;
    } catch (err) {
      try { await conn.rollback(); } catch (e) { /* ignore rollback error */ }
      console.error('Producto.eliminarPermanente tx failed for id=', id, err);
      // Intentar fallback sin transacción (por compatibilidad)
      try {
        try {
          await db.query('DELETE FROM items_orden WHERE producto_id = ?', [id]);
        } catch (e) {
          if (e && e.code === 'ER_NO_SUCH_TABLE') console.warn('items_orden table missing, skipping'); else throw e;
        }
        try {
          await db.query('DELETE FROM inventario WHERE producto_id = ?', [id]);
        } catch (e) {
          if (e && e.code === 'ER_NO_SUCH_TABLE') console.warn('inventario table missing, skipping'); else throw e;
        }
        const [res2] = await db.query('DELETE FROM productos WHERE id = ?', [id]);
        console.log('Producto.eliminarPermanente fallback id=', id, 'result=', res2);
        return res2 && res2.affectedRows ? res2.affectedRows : 0;
      } catch (err2) {
        console.error('Producto.eliminarPermanente fallback failed for id=', id, err2);
        throw err2;
      }
    } finally {
      try { conn.release(); } catch (e) {}
    }
  },

  // Eliminar producto (soft delete)
  async eliminar(id) {
    const [res] = await db.query('UPDATE productos SET activo = 0 WHERE id = ?', [id]);
    return res && res.affectedRows ? res.affectedRows : 0;
  },

  // Restaurar producto (marcar activo)
  async restaurar(id) {
    await db.query('UPDATE productos SET activo = 1 WHERE id = ?', [id]);
    return true;
  },

  // Actualizar stock
  async actualizarStock(id, stock) {
    const [res] = await db.query('UPDATE productos SET stock = ? WHERE id = ?', [stock, id]);
    return res && res.affectedRows ? res.affectedRows : 0;
  }
};
