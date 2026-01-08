const db = require('../config/db');

module.exports = {
  async todas() {
    const [rows] = await db.query('SELECT * FROM categorias ORDER BY nombre');
    return rows;
  }
};
