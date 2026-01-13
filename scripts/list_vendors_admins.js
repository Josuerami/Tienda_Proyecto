const db = require('../config/db');

(async () => {
  try {
    const [rows] = await db.query("SELECT id,email,rol FROM usuarios WHERE rol IN ('vendedor','admin') ORDER BY id DESC LIMIT 10");
    rows.forEach(r => console.log(`${r.rol}:${r.id}:${r.email}`));
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();