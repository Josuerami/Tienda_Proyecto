// modelos/Usuario.js
const pool = require('../config/db');

// Crear usuario y devolver el objeto completo
exports.crear = async ({ nombre, apellido_paterno, apellido_materno, email, password_hash, rol }) => {
  const sql = `
    INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, rol)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [nombre, apellido_paterno, apellido_materno, email, password_hash, rol]);
  const id = result.insertId;
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ? LIMIT 1', [id]);
  return rows[0];
};

exports.buscarPorEmail = async (email) => {
  const sql = `SELECT * FROM usuarios WHERE email = ? LIMIT 1`;
  const [rows] = await pool.query(sql, [email]);
  return rows[0];
};

exports.buscarPorId = async (id) => {
  const sql = `SELECT * FROM usuarios WHERE id = ? LIMIT 1`;
  const [rows] = await pool.query(sql, [id]);
  return rows[0] || null;
};

exports.actualizar = async (id, fields) => {
  // fields: { nombre, apellido_paterno, apellido_materno, email, password_hash, rol }
  const sets = [];
  const values = [];
  for (const key of Object.keys(fields)) {
    sets.push(`${key} = ?`);
    values.push(fields[key]);
  }
  if (sets.length === 0) return null;
  const sql = `UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`;
  values.push(id);
  await pool.query(sql, values);
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ? LIMIT 1', [id]);
  return rows[0];
};

exports.eliminar = async (id) => {
  await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
  return true;
};
