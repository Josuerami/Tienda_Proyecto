const db = require('../config/db');

const [, , idArg, forceFlag] = process.argv;
if (!idArg) {
  console.error('Uso: node delete_user.js <id> [--force]');
  process.exit(1);
}

(async () => {
  try {
    const id = Number(idArg);
    const [[user]] = await db.query('SELECT id,email,rol FROM usuarios WHERE id = ? LIMIT 1', [id]);
    if (!user) {
      console.error('Usuario no encontrado');
      process.exit(1);
    }
    if (user.rol === 'admin' && forceFlag !== '--force') {
      console.error('Refusing to delete an admin without --force flag');
      process.exit(1);
    }
    await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
    console.log('Usuario eliminado:', user.email);
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();