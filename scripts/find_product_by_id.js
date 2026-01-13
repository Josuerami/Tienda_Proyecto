const db = require('../config/db');
(async () => {
  try {
    const id = process.argv[2];
    if (!id) { console.error('Usage: node find_product_by_id.js <id>'); process.exit(2); }
    const [rows] = await db.query('SELECT id, nombre, activo, vendedor_id FROM productos WHERE id = ?', [id]);
    if (!rows.length) { console.log('NOTFOUND'); process.exit(0); }
    const r = rows[0];
    console.log(`${r.id},${r.nombre},${r.activo},${r.vendedor_id || 'null'}`);
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();