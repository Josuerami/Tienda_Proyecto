const db = require('../config/db');

async function fetchWithCookies(url, opts = {}, cookies = {}) {
  opts.headers = opts.headers || {};
  if (opts.body && !(opts.body instanceof URLSearchParams) && typeof opts.body === 'object') {
    opts.body = new URLSearchParams(opts.body);
  }
  if (cookies && Object.keys(cookies).length) {
    const cookieHeader = Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; ');
    opts.headers['Cookie'] = cookieHeader;
  }
  const res = await fetch(url, opts);
  const setCookies = res.headers.get('set-cookie');
  if (setCookies) {
    setCookies.split(',').forEach(pair => {
      const [cookie] = pair.split(';');
      const [k,v] = cookie.split('=');
      cookies[k.trim()] = v;
    });
  }
  const text = await res.text();
  return { res, text, cookies };
}

(async () => {
  try {
    const base = 'http://127.0.0.1:3000';
    console.log('Login as vendor1');
    let cookies = {};
    let r = await fetchWithCookies(base + '/auth/login', { method: 'POST', body: { email: 'vendedor1+1768262602235@example.com', password: 'Vendedor123' }, redirect: 'manual' }, cookies);
    cookies = r.cookies;
    console.log('Login status', r.res.status);

    const name = 'VERIFY-' + Date.now();
    console.log('Create product:', name);
    r = await fetchWithCookies(base + '/admin/productos/agregar', {
      method: 'POST',
      body: {
        nombre: name,
        descripcion: 'Testing edit/delete',
        precio: '7.00',
        categoria_id: '1',
        stock: '4',
        marca: 'V',
        proveedor: 'P',
        fecha_registro: (new Date()).toISOString().split('T')[0]
      },
      redirect: 'manual'
    }, cookies);
    console.log('Create status', r.res.status);

    const [rows] = await db.query('SELECT id, vendedor_id, activo FROM productos WHERE nombre = ? ORDER BY id DESC LIMIT 1', [name]);
    if (!rows.length) { console.error('Product missing'); return process.exit(1); }
    const prod = rows[0];
    console.log('Created product id=', prod.id, 'vendedor_id=', prod.vendedor_id, 'activo=', prod.activo);

    // Try edit as vendor1
    console.log('Attempting vendor1 edit...');
    const newName = name + '-VENDEDIT';
    r = await fetchWithCookies(base + `/admin/productos/editar/${prod.id}`, {
      method: 'POST',
      body: {
        nombre: newName,
        descripcion: 'Edited by vendor1',
        precio: '8.88',
        categoria_id: '1',
        stock: '5',
        marca: 'VEND',
        proveedor: 'Vendor',
        fecha_registro: (new Date()).toISOString().split('T')[0]
      },
      redirect: 'manual'
    }, cookies);
    console.log('Vendor edit status', r.res.status);
    const [r2] = await db.query('SELECT nombre FROM productos WHERE id = ? LIMIT 1', [prod.id]);
    console.log('DB name after vendor edit:', r2.length ? r2[0].nombre : 'missing');

    // Try delete as vendor1
    console.log('Attempting vendor1 delete...');
    const [countItemsBefore] = await db.query('SELECT COUNT(*) AS c FROM items_orden WHERE producto_id = ?', [prod.id]);
    const [countInvBefore] = await db.query('SELECT COUNT(*) AS c FROM inventario WHERE producto_id = ?', [prod.id]);
    console.log('Dependent rows before delete: items_orden=', countItemsBefore[0].c, 'inventario=', countInvBefore[0].c);
    r = await fetchWithCookies(base + '/admin/productos/eliminar', { method: 'POST', body: { producto_id: prod.id }, redirect: 'manual' }, cookies);
    console.log('Vendor delete status', r.res.status);
    const [r3] = await db.query('SELECT id FROM productos WHERE id = ? LIMIT 1', [prod.id]);
    console.log('DB exists after vendor delete:', r3.length ? 'YES' : 'NO');
    const [countItemsAfter] = await db.query('SELECT COUNT(*) AS c FROM items_orden WHERE producto_id = ?', [prod.id]);
    const [countInvAfter] = await db.query('SELECT COUNT(*) AS c FROM inventario WHERE producto_id = ?', [prod.id]);
    console.log('Dependent rows after delete: items_orden=', countItemsAfter[0].c, 'inventario=', countInvAfter[0].c);

    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
})();