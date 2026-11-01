// Pruebas automáticas de Mis viajes.
// Uso: cd pruebas && npm install && npx playwright install chromium && node pruebas.js
// Abre la app en un Chromium sin ventana y comprueba lo esencial, incluida la sincronización
// entre dos dispositivos con el conserje real (worker.js) sobre una base de datos de prueba.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const { crearD1, crearKV } = require('./d1shim.js');

const RAIZ = path.join(__dirname, '..');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const servidor = http.createServer((q, r) => {
  let f = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});

const resultados = [];
async function prueba(nombre, fn) {
  try { await fn(); resultados.push(['✓', nombre]); }
  catch (e) { resultados.push(['✗', nombre + ' — ' + e.message]); }
}
function igual(a, b, que) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(que + ': esperaba ' + JSON.stringify(b) + ' y salió ' + JSON.stringify(a)); }

(async () => {
  await new Promise(ok => servidor.listen(0, ok));
  const URL_APP = 'http://localhost:' + servidor.address().port + '/';
  const fs2 = require('fs'); fs2.copyFileSync(path.join(RAIZ, 'conserje', 'worker.js'), path.join(__dirname, 'worker.mjs'));
  const conserje = (await import(path.join(__dirname, 'worker.mjs'))).default;
  const env = { CLAVE_APP: 'clave-de-prueba', VIAJES: crearKV(), DB: crearD1() };
  const navegador = await chromium.launch();
  const errores = [];

  async function dispositivo(ancho, alto) {
    const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto } });
    await ctx.route(u => String(u).includes('workers.dev'), async ruta => {
      const rq = ruta.request();
      const sinCuerpo = rq.method() === 'GET' || rq.method() === 'OPTIONS';
      const res = await conserje.fetch(new Request(rq.url(), { method: rq.method(), headers: rq.headers(), body: sinCuerpo ? undefined : rq.postDataBuffer() }), env);
      const cab = {}; res.headers.forEach((v, k) => cab[k] = v); cab['access-control-allow-origin'] = '*';
      ruta.fulfill({ status: res.status, headers: cab, body: Buffer.from(await res.arrayBuffer()) });
    });
    const p = await ctx.newPage();
    p.on('pageerror', e => errores.push(e.message));
    p.on('console', m => { if (/Content Security Policy|Refused/.test(m.text())) errores.push(m.text()); });
    await p.goto(URL_APP); await p.evaluate(() => localStorage.setItem('mis-viajes-clave-ia', 'clave-de-prueba')); await p.reload(); await p.waitForTimeout(800);
    return p;
  }
  const sincronizar = p => p.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))).then(() => p.waitForTimeout(2500));

  const A = await dispositivo(390, 844), B = await dispositivo(820, 1180);

  await prueba('Arranca con las tipografías propias y sin scroll horizontal', async () => {
    igual(await A.evaluate(async () => { await document.fonts.ready; return document.fonts.check('500 16px "Instrument Sans"'); }), true, 'fuente');
    igual(await A.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'ancho');
  });

  await prueba('Crear un viaje con foto', async () => {
    await A.click('[data-a="nuevo"]'); await A.fill('#f-titulo', 'Roma'); await A.fill('#f-ini', '2030-12-10'); await A.fill('#f-fin', '2030-12-16');
    await A.setInputFiles('#f-foto', path.join(__dirname, 'foto.jpg')); await A.click('button[type=submit]'); await A.waitForTimeout(1200);
    igual(await A.locator('.carta').count(), 1, 'cartas');
  });

  await prueba('El texto se escapa (sin inyección de código)', async () => {
    await A.click('.carta.activa .carta-abrir'); await A.waitForTimeout(400);
    await A.click('[data-a="nuevoPlan"]'); await A.selectOption('#p-dia', '7'); await A.fill('#p-lugar', '<img src=x onerror="window.__xss=1">'); await A.click('.hoja button[type=submit]'); await A.waitForTimeout(300);
    igual(await A.evaluate(() => window.__xss || 0), 0, 'código ejecutado');
  });

  await prueba('No se guardan billetes vacíos', async () => {
    await A.click('[data-a="transporte"]'); await A.click('.hoja button[type=submit]'); await A.waitForTimeout(200);
    igual(await A.evaluate(() => !document.querySelector('#f-error').hidden), true, 'aviso de error');
    await A.keyboard.press('Escape'); await A.waitForTimeout(200);
    igual(await A.$('.hoja') === null, true, 'Escape cierra la ventana');
  });

  await prueba('Al acortar el viaje, los planes pasan al último día', async () => {
    await A.click('[data-a="datos"]'); await A.fill('#f-fin', '2030-12-12'); await A.click('button[type=submit]'); await A.waitForTimeout(400);
    igual(/Día 3/.test(await A.locator('.plan').first().innerText()), true, 'plan en el día 3');
  });

  await prueba('Los planes del mismo día van en una sola tarjeta', async () => {
    await A.click('[data-a="nuevoPlan"]'); await A.selectOption('#p-dia', '3'); await A.fill('#p-lugar', 'Fontana di Trevi'); await A.click('.hoja button[type=submit]'); await A.waitForTimeout(300);
    igual(await A.locator('.dia-plan').count(), 1, 'tarjetas de día');
    igual(await A.locator('.dia-plan .plan-item').count(), 2, 'planes en la tarjeta');
  });

  await prueba('Importar un KML pone la ruta en cada día', async () => {
    await A.click('.ruta-mini'); await A.click('[data-a="importarKml"]'); await A.setInputFiles('#kml', path.join(__dirname, 'ruta.kml')); await A.waitForTimeout(400);
    await A.click('[data-a="guardarKml"]'); await A.waitForTimeout(400);
    igual(await A.locator('.dia-plan .ruta-btn').count(), 2, 'rutas en las tarjetas');
    igual(/google\.com\/maps\/dir/.test(await A.getAttribute('.ruta-btn >> nth=0', 'href')), true, 'enlace de Google Maps');
  });

  await prueba('Artículos con el mismo nombre se marcan por separado', async () => {
    await A.click('.menu [data-a="maleta"]'); await A.waitForTimeout(300);
    await A.click('[data-a="plegar"] >> nth=0'); await A.click('[data-a="empezarItem"]'); await A.fill('#nuevo-item', 'Cargador'); await A.press('#nuevo-item', 'Enter'); await A.waitForTimeout(200);
    await A.click('[data-a="plegar"] >> nth=4'); await A.waitForTimeout(200);
    const botones = await A.$$('[data-a="empezarItem"]'); await botones[botones.length - 1].click(); await A.fill('#nuevo-item', 'Cargador'); await A.press('#nuevo-item', 'Enter'); await A.waitForTimeout(200);
    await A.locator('input[data-n="Cargador"]').first().check({ force: true }); await A.waitForTimeout(300);
    igual(await A.locator('input[data-n="Cargador"]:checked').count(), 1, 'marcados');
  });

  await prueba('Deshacer recupera un artículo borrado', async () => {
    const antes = await A.locator('.item').count();
    await A.click('[data-a="quitarItem"] >> nth=0'); await A.waitForTimeout(300);
    await A.click('#toast .deshacer'); await A.waitForTimeout(300);
    igual(await A.locator('.item').count(), antes, 'artículos');
    await A.click('[data-a="cerrar"]'); await A.waitForTimeout(300);
  });

  await prueba('La lectura con IA se puede cancelar', async () => {
    const esLectura = u => String(u) === 'https://mis-viajes-ia.fgstrash.workers.dev/', colgada = () => {};
    await A.route(esLectura, colgada); // no responde nunca
    await A.click('[data-a="leerReserva"]'); await A.setInputFiles('#reserva', path.join(__dirname, 'vacio.pdf')); await A.waitForTimeout(800);
    await A.click('[data-a="cancelarLectura"]'); await A.waitForTimeout(600);
    igual(await A.$('.hoja') === null, true, 'vuelve a la ficha');
    await A.unroute(esLectura, colgada);
  });

  await prueba('Sincroniza viaje y foto con el otro dispositivo', async () => {
    await sincronizar(A); await sincronizar(B);
    igual(await B.locator('.carta').count(), 1, 'cartas en B');
    const fotos = await B.evaluate(() => new Promise(ok => { const r = indexedDB.open('mis-viajes', 1); r.onsuccess = () => { const q = r.result.transaction('fotos').objectStore('fotos').count(); q.onsuccess = () => ok(q.result); }; }));
    igual(fotos, 1, 'fotos en B');
  });

  await prueba('Una edición en B llega a A', async () => {
    await B.click('.carta.activa .carta-abrir'); await B.waitForTimeout(400);
    await B.click('[data-a="datos"]'); await B.fill('#f-titulo', 'Roma y Nápoles'); await B.click('button[type=submit]'); await B.waitForTimeout(300);
    await sincronizar(B); await A.click('[data-a="inicio"]'); await sincronizar(A);
    igual(await A.evaluate(() => document.body.innerText.includes('Roma y Nápoles')), true, 'título en A');
  });

  await prueba('Borrar en A lo borra en B', async () => {
    await A.click('.carta.activa .borrar-carta'); await A.waitForTimeout(150); await A.click('.carta.activa .borrar-carta'); await A.waitForTimeout(300);
    await sincronizar(A); await sincronizar(B);
    igual(await B.locator('.carta').count(), 0, 'cartas en B');
  });

  await prueba('Sin errores de JavaScript ni de la política de seguridad', async () => { igual(errores, [], 'errores'); });

  await navegador.close(); servidor.close();
  try { fs.unlinkSync(path.join(__dirname, 'worker.mjs')); } catch (e) {}
  resultados.forEach(r => console.log(r[0] + ' ' + r[1]));
  const fallos = resultados.filter(r => r[0] === '✗').length;
  console.log(fallos ? '\n' + fallos + ' prueba(s) fallida(s)' : '\nTodas las pruebas pasan (' + resultados.length + ')');
  process.exit(fallos ? 1 : 0);
})();
