const db = require('../config/db');

module.exports = {
  async emitir(pedido_id) {
    const [res] = await db.query('INSERT INTO tickets (pedido_id) VALUES (?)', [pedido_id]);
    return res.insertId;
  },
  async contarHoy() {
    const [[row]] = await db.query('SELECT COUNT(*) AS c FROM tickets WHERE DATE(emitido_en) = CURDATE()');
    return row.c || 0;
  }
};
