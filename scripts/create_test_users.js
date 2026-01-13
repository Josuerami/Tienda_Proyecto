const db = require('../config/db');
const bcrypt = require('bcrypt');

(async () => {
  try {
    const make = async (name, email, pass, role) => {
      console.log('Checking', email);
      const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (existing.length) {
        console.log(`${role}:exists:${existing[0].id}:${email}`);
        return existing[0].id;
      }
      const hash = await bcrypt.hash(pass, 10);
      const [r] = await db.query(
        'INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, rol) VALUES (?,?,?,?,?,?)',
        [name, 'Prueba', '', email, hash, role]
      );
      console.log(`${role}:created:${r.insertId}:${email}`);
      return r.insertId;
    };

    const t = Date.now();
    const email1 = `vendedor1+${t}@example.com`;
    const id1 = await make('Vend1', email1, 'Vendedor123', 'vendedor');
    const email2 = `vendedor2+${t}@example.com`;
    const id2 = await make('Vend2', email2, 'Vendedor234', 'vendedor');
    const email3 = `admintest+${t}@example.com`;
    const id3 = await make('AdminTest', email3, 'Admin1234', 'admin');

    console.log('DONE', id1, id2, id3);
    process.exit(0);
  } catch (err) {
    console.error('ERROR creating users:', err);
    process.exit(1);
  }
})();