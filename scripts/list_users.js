const db = require('../config/db');

(async () => {
  try {
    const [rows] = await db.query('SELECT id,nombre,apellido_paterno,email,rol,fecha_creacion FROM usuarios ORDER BY id DESC');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();