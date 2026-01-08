// modelos/Usuario.js
const pool = require('../config/db');  // ✅ ahora sí apunta al archivo correcto

exports.crear = async ({ nombre, apellido_paterno, apellido_materno, email, password_hash, rol }) => {
  const sql = `
    INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, rol)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [nombre, apellido_paterno, apellido_materno, email, password_hash, rol]);
  return result.insertId;
};

exports.buscarPorEmail = async (email) => {
  const sql = `SELECT * FROM usuarios WHERE email = ? LIMIT 1`;
  const [rows] = await pool.query(sql, [email]);
  return rows[0];
};
