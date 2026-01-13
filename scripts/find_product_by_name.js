const db = require('../config/db');
(async () => {
  try {
    const name = process.argv[2];
    if (!name) { console.error('Usage: node find_product_by_name.js <name>'); process.exit(2); }
    const [rows] = await db.query('SELECT id, activo, vendedor_id, nombre FROM productos WHERE nombre = ? ORDER BY id DESC LIMIT 1', [name]);
    if (!rows.length) { console.log('NOTFOUND'); process.exit(0); }
    const r = rows[0];
    console.log(`${r.id},${r.activo},${r.vendedor_id || 'null'}`);
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();