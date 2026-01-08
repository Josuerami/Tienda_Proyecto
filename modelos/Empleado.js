const db = require('../config/db');

module.exports = {
  async crear({ nombre, apellido, ruta_foto, edad, genero, contacto, fecha_contratacion, clave_acceso, horario, password_hash, salario = 0 }) {
    const [res] = await db.query(
      'INSERT INTO empleados (nombre, apellido, ruta_foto, edad, genero, contacto, fecha_contratacion, clave_acceso, horario, password_hash, salario) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [nombre, apellido, ruta_foto || null, edad || 0, genero, contacto, fecha_contratacion, clave_acceso, horario, password_hash, salario]
    );
    return res.insertId;
  },
  async todos() {
    const [rows] = await db.query('SELECT * FROM empleados ORDER BY id DESC');
    return rows;
  },
  async actualizarSalario(id, salario) {
    await db.query('UPDATE empleados SET salario = ? WHERE id = ?', [salario, id]);
  },
  async eliminar(id) {
    await db.query('DELETE FROM empleados WHERE id = ?', [id]);
  }
};
