const mysql = require('mysql2/promise');

// Configura tu conexión a MySQL
const pool = mysql.createPool({
  host: 'localhost',       // servidor de MySQL
  user: 'root',            // tu usuario de MySQL
  password: '',            // tu contraseña de MySQL
  database: 'tienda_canelitos',      // nombre de tu base de datos
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
