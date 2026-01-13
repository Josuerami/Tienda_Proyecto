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
    // set-cookie may contain multiple cookies separated by comma — simple parse
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

    console.log('1) Login as vendor1...');
    let cookies = {};
    let r = await fetchWithCookies(base + '/auth/login', {
      method: 'POST',
      body: { email: 'vendedor1+1768262602235@example.com', password: 'Vendedor123' },
      redirect: 'manual'
    }, cookies);
    cookies = r.cookies;
    console.log('Login status', r.res.status);
    if (r.res.status !== 200 && r.res.status !== 302) return process.exit(1);

    const name = 'ITEST-' + Date.now();
    console.log('2) Creating product as vendor1:', name);
    r = await fetchWithCookies(base + '/admin/productos/agregar', {
      method: 'POST',
      body: {
        nombre: name,
        descripcion: 'Integration test product',
        precio: '5.50',
        categoria_id: '1',
        stock: '3',
        marca: 'IT',
        proveedor: 'Scenario',
        fecha_registro: (new Date()).toISOString().split('T')[0]
      },
      redirect: 'manual'
    }, cookies);
    console.log('Create status', r.res.status);

    console.log('3) Verify product appears in vendor1 admin list');
    r = await fetchWithCookies(base + '/admin/productos', { method: 'GET' }, cookies);
    if (r.text.includes(name)) console.log('Product found in /admin/productos'); else console.log('Product NOT found in /admin/productos');

    console.log('4) Read product id from DB');
    const [rows] = await db.query('SELECT id, vendedor_id, nombre FROM productos WHERE nombre = ? ORDER BY id DESC LIMIT 1', [name]);
    if (!rows.length) {
      console.error('Product missing in DB, abort');
      return process.exit(1);
    }
    const prod = rows[0];
    console.log('Product id:', prod.id, 'vendedor_id:', prod.vendedor_id);

    console.log('5) Login as vendor2 and try to access edit page (should be denied/redirect)');
    let cookies2 = {};
    r = await fetchWithCookies(base + '/auth/login', { method: 'POST', body: { email: 'vendedor2+1768262602235@example.com', password: 'Vendedor234' }, redirect: 'manual' }, cookies2);
    cookies2 = r.cookies;
    r = await fetchWithCookies(base + `/admin/productos/editar/${prod.id}`, { method: 'GET', redirect: 'manual' }, cookies2);
    console.log('Vendor2 edit page status:', r.res.status);
    if (r.res.status === 302 || !r.text.includes('Editar producto')) console.log('Vendor2 correctly denied or not allowed'); else console.log('Vendor2 unexpectedly can access edit page');

    console.log('6) Login as admin and edit product');
    let cookiesA = {};
    r = await fetchWithCookies(base + '/auth/login', { method: 'POST', body: { email: 'admintest+1768262602235@example.com', password: 'Admin1234' }, redirect: 'manual' }, cookiesA);
    cookiesA = r.cookies;
    const newName = name + '-EDIT';
    r = await fetchWithCookies(base + `/admin/productos/editar/${prod.id}`, {
      method: 'POST',
      body: {
        nombre: newName,
        descripcion: 'Edited by admin',
        precio: '11.11',
        categoria_id: '1',
        stock: '10',
        marca: 'ADM',
        proveedor: 'Admin',
        fecha_registro: (new Date()).toISOString().split('T')[0]
      },
      redirect: 'manual'
    }, cookiesA);
    console.log('Admin edit status:', r.res.status);

    console.log('7) Verify in DB that name changed');
    const [r2] = await db.query('SELECT id FROM productos WHERE nombre = ? LIMIT 1', [newName]);
    if (r2.length) console.log('Admin edit verified in DB'); else console.log('Admin edit NOT visible in DB');

    console.log('Integration test finished.');
    process.exit(0);
  } catch (err) {
    console.error('ERROR in test:', err);
    process.exit(1);
  }
})();
