const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'sql5.freesqldatabase.com',
  port: 3306,
  user: 'sql5813810',
  password: 'ILEdTJdymB',
  database: 'sql5813810',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
