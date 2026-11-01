/* Mis viajes · lógica de la app */
(function(){
'use strict';

/* ---------- utilidades ---------- */
var $ = function(s, r){ return (r || document).querySelector(s); };
var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
var clone = function(x){ return JSON.parse(JSON.stringify(x)); };
var nuevoId = function(p){ return (p || 'v') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
function iso(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function hoy(){ return iso(new Date()); }
function aFecha(s){ var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function noches(a, b){ return Math.round((aFecha(b) - aFecha(a)) / 864e5); }
function sinPunto(t){ return t.replace(/\./g, ''); }
function fmt(d, o){ return sinPunto(d.toLocaleDateString('es-ES', o)); }
function corto(d){ return fmt(d, {day: 'numeric', month: 'short'}); }
function textoNoches(n){ return n === 1 ? '1 noche' : n + ' noches'; }
function rango(t){ var a = aFecha(t.inicio), b = aFecha(t.fin); return corto(a) + ' — ' + corto(b) + ' ' + b.getFullYear(); }
function diaFecha(t, n){ var a = aFecha(t.inicio); return new Date(a.getFullYear(), a.getMonth(), a.getDate() + n - 1); }
function duracionTexto(a, b){
  if (!a || !b) return '—';
  var n = noches(a, b);
  if (n < 0) return 'La vuelta es antes que la ida';
  return (n + 1) + (n === 0 ? ' día' : ' días') + ' · ' + textoNoches(n);
}

var IC = {
  mas: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  masP: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  xP: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  atras: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  flecha: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  arriba: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  abajo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  lapiz: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  camara: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  coche: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 16v-3.5L5 8a2 2 0 0 1 1.8-1.2h10.4A2 2 0 0 1 19 8l2 4.5V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3.5 12.5h17"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
  pin: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-5.7-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.3 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/></svg>',
  pinP: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>',
  maleta: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="7" width="16" height="13" rx="2.5"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 11v5M15 11v5"/></svg>',
  basura: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>',
  chevA: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
  chevB: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  avion: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 13.5 21 6l-4 12-5-4-3 4v-5.5"/></svg>',
  tren: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM5 10h14M9 21l1.5-4M15 21l-1.5-4"/></svg>',
  bus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12a2 2 0 0 1 2 2v12H4V5a2 2 0 0 1 2-2zM4 11h16M7.5 17v3M16.5 17v3"/></svg>'
};
IC.ruta = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" stroke-dasharray="2.2 2.4"/></svg>';
IC.doc = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
IC.chispa = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>';
IC.cama = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.8"/></svg>';
IC.casa = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/></svg>';
IC.pegar = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4.5" width="14" height="16.5" rx="2.5"/><path d="M9 4.5V4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v.5"/><path d="M9 12.5l2.2 2.2L15.5 10"/></svg>';
IC.copiar = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
IC.flechaP = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
var CONSERJE = 'https://mis-viajes-ia.fgstrash.workers.dev';
var LS_CLAVE_IA = 'mis-viajes-clave-ia';
function claveIA(){ try { return localStorage.getItem(LS_CLAVE_IA) || ''; } catch (e) { return ''; } }
var TIPOS = {
  avion: {nombre: 'Avión', numero: 'Vuelo', etNumero: 'Nº de vuelo', compania: 'Aerolínea'},
  tren: {nombre: 'Tren', numero: 'Tren', etNumero: 'Nº de tren', compania: 'Compañía'},
  bus: {nombre: 'Bus', numero: 'Bus', etNumero: 'Nº de bus', compania: 'Compañía'}
};

function maletaBase(){
  return {
    grupos: [
      {nombre: 'Documentos', items: ['Pasaporte / DNI', 'Tarjetas de embarque', 'Seguro de viaje', 'Copia de documentos importantes']},
      {nombre: 'Ropa', items: ['Camisetas', 'Pantalones', 'Calcetines', 'Ropa interior', 'Pijama', 'Zapatos']},
      {nombre: 'Aseo', items: ['Cepillo y pasta de dientes', 'Champú y gel', 'Desodorante', 'Crema solar']},
      {nombre: 'Salud', items: ['Medicamentos', 'Botiquín básico']},
      {nombre: 'Electrónica', items: ['Móvil y cargador', 'Power bank', 'Adaptador de enchufe', 'Auriculares']},
      {nombre: 'Dinero', items: ['Cartera', 'Tarjeta de crédito', 'Efectivo']},
      {nombre: 'Entretenimiento', items: ['Libro']}
    ],
    tareas: ['Cerrar con llave las puertas', 'Desconectar los aparatos electrónicos', 'Vaciar la nevera y la basura', 'Cerrar el agua', 'Avisar a los vecinos'],
    marcados: {}
  };
}

/* ---------- estado ---------- */
var S = {
  cargado: false, viajes: [], vista: 'inicio', viajeId: null, activo: 0,
  hoja: null, cerrados: {}, anadiendo: null, borrador: '', subiendo: false,
  confirmar: false, pendienteRender: false
};
var db = null, assets = null, modoLocal = false;
var LS = 'organizador-viajes-v1';

function tieneVuelta(t){ var x = t && t.vuelta; return !!(x && (x.origen || x.destino || x.hora || x.numero)); }
function billetes(v){ return v ? (v.billetes && v.billetes.length ? v.billetes : (v.transporte ? [v.transporte] : [])) : []; }
function ordenarBilletes(l){ return l.slice().sort(function(x, y){ var a = ((x.ida && x.ida.fecha) || '9') + ((x.ida && x.ida.hora) || ''), b = ((y.ida && y.ida.fecha) || '9') + ((y.ida && y.ida.hora) || ''); return a < b ? -1 : a > b ? 1 : 0; }); }
function ponerBilletes(v, lista){ lista = ordenarBilletes(lista); v.billetes = lista; v.transporte = lista[0] || null; }
function viaje(id){ for (var i = 0; i < S.viajes.length; i++) if (S.viajes[i].id === (id || S.viajeId)) return S.viajes[i]; return null; }
function ordenInicio(a, b){ return a.inicio < b.inicio ? -1 : a.inicio > b.inicio ? 1 : (a.creado || 0) - (b.creado || 0); }
function pendientes(){ var h = hoy(); return S.viajes.filter(function(v){ return v.fin >= h; }).sort(ordenInicio); }
function pasados(){ var h = hoy(); return S.viajes.filter(function(v){ return v.fin < h; }).sort(function(a, b){ return -ordenInicio(a, b); }); }

/* ---------- guardado ---------- */
function toast(t){
  var el = $('#toast'); el.textContent = t; el.hidden = false; toast._deshacer = null;
  clearTimeout(toast._t); toast._t = setTimeout(function(){ el.hidden = true; }, 3200);
}
/* Aviso con botón Deshacer: vuelve a guardar el viaje tal como estaba antes de borrar */
function toastDeshacer(t, antes){
  var el = $('#toast');
  el.innerHTML = '<span>' + esc(t) + '</span><button type="button" class="deshacer">Deshacer</button>'; el.hidden = false;
  toast._deshacer = clone(antes);
  clearTimeout(toast._t); toast._t = setTimeout(function(){ el.hidden = true; toast._deshacer = null; }, 6000);
}
document.addEventListener('click', function(e){
  if (!e.target.closest || !e.target.closest('#toast .deshacer') || !toast._deshacer) return;
  var v = toast._deshacer; toast._deshacer = null;
  guardar(v); $('#toast').hidden = true;
  if (!S.hoja || S.hoja.tipo === 'maleta') render(); else S.pendienteRender = true;
});
/* Almacén en el propio dispositivo: IndexedDB (viajes y fotos), con localStorage como respaldo */
var BD = null;
function abrirBD(){
  return new Promise(function(ok){
    try {
      var r = indexedDB.open('mis-viajes', 1);
      r.onupgradeneeded = function(){ var d = r.result; d.createObjectStore('viajes', {keyPath: 'id'}); d.createObjectStore('fotos'); };
      r.onsuccess = function(){ ok(r.result); };
      r.onerror = function(){ ok(null); };
      r.onblocked = function(){ ok(null); };
    } catch (e) { ok(null); }
  });
}
function tx(almacen, modo, fn){
  return new Promise(function(ok, ko){
    if (!BD) return ko(new Error('sin-bd'));
    var t = BD.transaction(almacen, modo), st = t.objectStore(almacen), res;
    var r = fn(st); if (r) r.onsuccess = function(){ res = r.result; };
    t.oncomplete = function(){ ok(res); };
    t.onerror = t.onabort = function(){ ko(t.error || new Error('tx')); };
  });
}
function guardarLocal(){ try { localStorage.setItem(LS, JSON.stringify(S.viajes)); } catch (e) {} }
function avisoGuardado(){ toast('No se pudo guardar. Libera espacio en este dispositivo y vuelve a intentarlo.'); }
function guardar(v, remoto){
  if (!remoto) v.actualizado = Math.max(Date.now(), (v.actualizado || 0) + 1);
  var i = S.viajes.findIndex(function(x){ return x.id === v.id; });
  if (i < 0) S.viajes.push(v); else S.viajes[i] = v;
  if (BD) tx('viajes', 'readwrite', function(st){ return st.put(clone(v)); }).catch(avisoGuardado);
  else guardarLocal();
  if (!remoto) Sync.marcar(v.id);
}
function borrarViaje(v, remoto){
  S.viajes = S.viajes.filter(function(x){ return x.id !== v.id; });
  if (BD) tx('viajes', 'readwrite', function(st){ return st.delete(v.id); }).catch(function(){});
  else guardarLocal();
  if (v.fotoId && assets) assets.delete(v.fotoId).catch(function(){});
  if (!remoto) Sync.borrado(v.id);
}

/* ---------- Sincronización entre dispositivos (a través del conserje) ---------- */
var Sync = (function(){
  var LSK = 'mis-viajes-sync';
  var est = {sucios: {}, borrados: {}, fotos: {}, ultima: 0, iniciado: false, cursor: 0, error: ''};
  try { var g = JSON.parse(localStorage.getItem(LSK) || 'null'); if (g) est = Object.assign(est, g, {error: ''}); } catch (e) {}
  var enCurso = false, otraVez = false, tProg = null, tCada = null;
  function salvar(){ try { localStorage.setItem(LSK, JSON.stringify({sucios: est.sucios, borrados: est.borrados, fotos: est.fotos, ultima: est.ultima, iniciado: est.iniciado, cursor: est.cursor})); } catch (e) {} }
  function activo(){ return !!claveIA(); }
  function programar(ms){ if (!activo()) return; clearTimeout(tProg); tProg = setTimeout(ahora, ms == null ? 1500 : ms); }
  function cab(extra){ return Object.assign({'X-Clave-App': claveIA()}, extra || {}); }
  async function pedir(ruta, op){
    var r = await fetch(CONSERJE + ruta, op);
    if (r.status === 401) throw {code: 'clave'};
    if (r.status === 503) throw {code: 'almacen'};
    if (!r.ok) throw {code: 'red'};
    return r;
  }
  async function subirFotos(){
    var ids = Object.keys(est.fotos);
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], b = null;
      try { b = await assets.leer(id); } catch (e) {}
      if (b) await pedir('/foto/' + encodeURIComponent(id), {method: 'PUT', headers: cab({'Content-Type': b.type || 'image/jpeg'}), body: b});
      delete est.fotos[id]; salvar();
    }
  }
  async function bajarFotos(){
    var cambio = false;
    for (var i = 0; i < S.viajes.length; i++) {
      var id = S.viajes[i].fotoId;
      if (!id || !BD || est.fotos[id]) continue;
      var tiene = null; try { tiene = await assets.leer(id); } catch (e) {}
      if (tiene) continue;
      try {
        var r = await fetch(CONSERJE + '/foto/' + encodeURIComponent(id), {headers: cab()});
        if (!r.ok) continue;
        var b = await r.blob();
        await tx('fotos', 'readwrite', function(st){ return st.put(b, id); });
        delete cargandoFoto[id]; cambio = true;
      } catch (e) {}
    }
    return cambio;
  }
  function aplicar(res, enviados){
    var cambio = false, antesId = (pendientes()[S.activo] || {}).id;
    var servidor = {}; (res.viajes || []).forEach(function(v){ if (v && v.id) servidor[v.id] = v; });
    var borr = res.borrados || {};
    // Lo enviado y no modificado desde entonces ya está en la nube
    Object.keys(enviados.sucios).forEach(function(id){ var l = viaje(id); if (!l || (l.actualizado || 0) === enviados.sucios[id]) delete est.sucios[id]; });
    Object.keys(enviados.borrados).forEach(function(id){ if (est.borrados[id] === enviados.borrados[id]) delete est.borrados[id]; });
    // Solo se acepta lo que es más nuevo que la copia local; si la local es más nueva, se vuelve a enviar
    Object.keys(servidor).forEach(function(id){
      if (est.sucios[id] || est.borrados[id]) return;
      var r = servidor[id], l = viaje(id), vr = r.actualizado || 0, vl = l ? (l.actualizado || 0) : -1;
      if (vr > vl) {
        if (l && l.fotoId && l.fotoId !== r.fotoId && assets) assets.delete(l.fotoId).catch(function(){});
        guardar(r, true); cambio = true;
      } else if (vl > vr) { est.sucios[id] = 1; otraVez = true; }
    });
    Object.keys(borr).forEach(function(id){
      var l = viaje(id);
      if (!l || est.sucios[id]) return;
      if (borr[id] >= (l.actualizado || 0)) { borrarViaje(l, true); cambio = true; }
      else { est.sucios[id] = 1; otraVez = true; }
    });
    // En una respuesta completa, lo que falta en la nube se vuelve a enviar
    if (res.completo !== false) S.viajes.forEach(function(l){
      if (!servidor[l.id] && !borr[l.id] && !est.sucios[l.id]) { est.sucios[l.id] = 1; otraVez = true; }
    });
    if (typeof res.hasta === 'number') est.cursor = res.hasta;
    if (cambio && antesId) { var p = pendientes().findIndex(function(v){ return v.id === antesId; }); if (p >= 0) S.activo = p; }
    if (S.activo >= pendientes().length) S.activo = Math.max(0, pendientes().length - 1);
    return cambio;
  }
  function refrescar(){
    if (S.hoja) { S.pendienteRender = true; return; }
    if (S.vista === 'inicio' && arrastrando()) return;
    render();
  }
  async function ahora(){
    if (!activo() || !S.cargado) return;
    if (enCurso) { otraVez = true; return; }
    enCurso = true; otraVez = false;
    try {
      if (!est.iniciado) {
        S.viajes.forEach(function(v){ est.sucios[v.id] = 1; if (v.fotoId) est.fotos[v.fotoId] = 1; });
        est.iniciado = true; salvar();
      }
      if (BD) await subirFotos();
      var enviados = {sucios: {}, borrados: Object.assign({}, est.borrados)};
      var cambios = Object.keys(est.sucios).map(function(id){ var v = viaje(id); if (v) enviados.sucios[id] = v.actualizado || 0; return v; }).filter(Boolean);
      var r = await pedir('/sync', {method: 'POST', headers: cab({'Content-Type': 'application/json'}), body: JSON.stringify({cambios: cambios, borrados: enviados.borrados, desde: est.cursor || 0})});
      var res = await r.json();
      var cambio = aplicar(res, enviados);
      est.ultima = Date.now(); est.error = ''; salvar();
      if (cambio) refrescar();
      if (await bajarFotos()) refrescar();
    } catch (e) {
      est.error = (e && e.code) || 'red';
    }
    enCurso = false;
    if (S.hoja && S.hoja.tipo === 'copia') render();
    if (otraVez) programar(1500);
  }
  function marcar(id){ est.sucios[id] = 1; salvar(); programar(); }
  function borrado(id){ delete est.sucios[id]; est.borrados[id] = Date.now(); salvar(); programar(); }
  function foto(id){ est.fotos[id] = 1; salvar(); programar(); }
  function arrancar(){
    programar(300);
    clearInterval(tCada);
    tCada = setInterval(function(){ if (!document.hidden) ahora(); }, 15000);
    document.addEventListener('visibilitychange', function(){ if (document.hidden) { if (Object.keys(est.sucios).length || Object.keys(est.borrados).length) ahora(); } else programar(200); });
    window.addEventListener('online', function(){ programar(500); });
  }
  function texto(){
    if (!activo()) return 'Desactivada: guarda arriba la contraseña de la app para sincronizar este dispositivo.';
    if (est.error === 'almacen') return 'Falta conectar el almacén VIAJES en Cloudflare.';
    if (est.error === 'clave') return 'La contraseña no coincide con la de Cloudflare.';
    var pend = Object.keys(est.sucios).length + Object.keys(est.borrados).length + Object.keys(est.fotos).length;
    if (est.error) return 'Sin conexión' + (pend ? ': hay cambios pendientes de enviar' : '') + '. Se reintentará sola.';
    if (!est.ultima) return enCurso ? 'Sincronizando…' : 'Activada. Aún no se ha sincronizado.';
    var m = Math.round((Date.now() - est.ultima) / 60000);
    return 'Activada · última vez ' + (m < 1 ? 'hace un momento' : m === 1 ? 'hace 1 minuto' : m < 60 ? 'hace ' + m + ' minutos' : 'hace más de una hora') + (pend ? ' · ' + pend + ' cambio' + (pend === 1 ? '' : 's') + ' pendiente' + (pend === 1 ? '' : 's') : '') + '.';
  }
  return {ahora: ahora, marcar: marcar, borrado: borrado, foto: foto, arrancar: arrancar, texto: texto, programar: programar, error: function(){ return est.error; }};
})();
function arrastrando(){ return !!(gesto && gesto.y !== null && gesto.y !== undefined); }
var urlsFoto = {}, cargandoFoto = {};
assets = {
  upload: function(blob){
    var id = nuevoId('f');
    return tx('fotos', 'readwrite', function(st){ return st.put(blob, id); }).then(function(){ urlsFoto[id] = URL.createObjectURL(blob); return {id: id}; });
  },
  delete: function(id){
    if (urlsFoto[id]) { URL.revokeObjectURL(urlsFoto[id]); delete urlsFoto[id]; }
    return tx('fotos', 'readwrite', function(st){ return st.delete(id); });
  },
  leer: function(id){ return tx('fotos', 'readonly', function(st){ return st.get(id); }); }
};
function fotoUrl(id){
  if (!id) return null;
  if (urlsFoto[id]) return urlsFoto[id];
  if (!cargandoFoto[id] && BD) {
    cargandoFoto[id] = true;
    assets.leer(id).then(function(b){ if (b) { urlsFoto[id] = URL.createObjectURL(b); if (!S.hoja) { if (S.vista === 'inicio') actualizarFondo(); else render(); } } }).catch(function(){});
  }
  return null;
}
async function iniciar(){
  BD = await abrirBD();
  if (!BD) { modoLocal = true; assets = null; }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  try {
    if (BD) {
      S.viajes = (await tx('viajes', 'readonly', function(st){ return st.getAll(); })) || [];
      if (!S.viajes.length) {
        var viejos = JSON.parse(localStorage.getItem(LS) || '[]') || [];
        for (var i = 0; i < viejos.length; i++) guardar(viejos[i]);
      }
    } else {
      S.viajes = JSON.parse(localStorage.getItem(LS) || '[]') || [];
    }
  } catch (e) { S.viajes = S.viajes || []; }
  S.cargado = true; render();
  Sync.arrancar();
  if (BD) assets.leer('fondo-inicio').then(function(b){ if (b) ponerFondo(b); }).catch(function(){});
}
var urlFondo = null;
function ponerFondo(blob){
  if (urlFondo) URL.revokeObjectURL(urlFondo);
  urlFondo = blob ? URL.createObjectURL(blob) : null;
  actualizarFondo(true);
}
/* Fondo del inicio: la foto del viaje que está delante; si no tiene, el fondo general */
var fondoActual = null, capaActiva = 'a';
/* Carrusel de fotos cuando no hay viaje (o el viaje no tiene foto) */
var CARRUSEL = ['img/inicio-1.webp', 'img/inicio-2.webp', 'img/inicio-3.webp'], idxCarrusel = 0, tCarrusel = null;
function urlFondoPorDefecto(){
  if (urlFondo) return urlFondo;
  return CARRUSEL[idxCarrusel];
}
function gestionarCarrusel(enCarrusel){
  if (enCarrusel && !tCarrusel) {
    tCarrusel = setInterval(function(){
      if (S.hoja || S.vista !== 'inicio' || document.hidden) return;
      idxCarrusel = (idxCarrusel + 1) % CARRUSEL.length;
      CARRUSEL.slice(idxCarrusel + 1, idxCarrusel + 2).forEach(function(u){ new Image().src = u; });
      actualizarFondo();
    }, 7000);
  } else if (!enCarrusel && tCarrusel) { clearInterval(tCarrusel); tCarrusel = null; }
}
function actualizarFondo(forzar){
  var v = pendientes()[S.activo];
  var url = (v && v.fotoId && fotoUrl(v.fotoId)) || urlFondoPorDefecto();
  gestionarCarrusel(CARRUSEL.indexOf(url) >= 0);
  if (url === fondoActual && !forzar) return;
  fondoActual = url;
  var siguiente = capaActiva === 'a' ? 'b' : 'a';
  var capa = document.getElementById('fondo-' + siguiente), vieja = document.getElementById('fondo-' + capaActiva);
  var mostrar = function(){
    if (fondoActual !== url) return;
    capa.style.backgroundImage = 'url("' + url + '")';
    capa.classList.add('visible'); vieja.classList.remove('visible');
    capaActiva = siguiente;
  };
  var img = new Image(); img.onload = mostrar; img.onerror = mostrar; img.src = url;
}
async function cambiarFondo(file){
  try {
    var b = await reducir(file);
    await tx('fotos', 'readwrite', function(st){ return st.put(b, 'fondo-inicio'); });
    ponerFondo(b); toast('Fondo del inicio cambiado');
  } catch (e) { toast('No se pudo usar esa foto. Prueba con otra.'); }
}

/* Copia de seguridad */
function blobADataUrl(b){ return new Promise(function(ok){ var r = new FileReader(); r.onload = function(){ ok(r.result); }; r.onerror = function(){ ok(null); }; r.readAsDataURL(b); }); }
async function exportar(){
  try {
    var fotos = {};
    for (var i = 0; i < S.viajes.length; i++) {
      var id = S.viajes[i].fotoId;
      if (id && assets) { var b = await assets.leer(id); if (b) fotos[id] = await blobADataUrl(b); }
    }
    var json = JSON.stringify({app: 'mis-viajes', version: 1, fecha: new Date().toISOString(), viajes: S.viajes, fotos: fotos});
    var nombre = 'mis-viajes-' + hoy() + '.json';
    var archivo = new File([json], nombre, {type: 'application/json'});
    if (navigator.canShare && navigator.canShare({files: [archivo]})) {
      await navigator.share({files: [archivo], title: 'Copia de Mis viajes'});
    } else {
      var a = document.createElement('a'); a.href = URL.createObjectURL(archivo); a.download = nombre;
      document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    }
  } catch (e) {
    if (!e || e.name !== 'AbortError') toast('No se pudo crear la copia. Vuelve a intentarlo.');
  }
}
async function importar(file){
  try {
    var datos = JSON.parse(await file.text());
    if (!datos || datos.app !== 'mis-viajes' || !Array.isArray(datos.viajes)) throw new Error('formato');
    var fotos = datos.fotos || {};
    for (var id in fotos) {
      if (!fotos[id] || !assets) continue;
      var blob = await (await fetch(fotos[id])).blob();
      await tx('fotos', 'readwrite', function(st){ return st.put(blob, id); });
      Sync.foto(id);
    }
    datos.viajes.forEach(function(v){ if (v && v.id && v.titulo && v.inicio && v.fin) guardar(v); });
    cerrarHoja(); toast('Copia restaurada: ' + datos.viajes.length + (datos.viajes.length === 1 ? ' viaje' : ' viajes'));
  } catch (e) {
    toast('Ese archivo no es una copia de Mis viajes.');
  }
}

/* ---------- navegación ---------- */
function irA(vista, extra){
  S.vista = vista; S.hoja = null; S.anadiendo = null; S.confirmar = false;
  if (extra) for (var k in extra) S[k] = extra[k];
  render(); try { window.scrollTo(0, 0); } catch (e) {}
}
function abrirHoja(h){
  if (!S.hoja) S.focoAntes = document.activeElement;
  S.hoja = h; S.confirmar = false; render(); try { window.scrollTo(0, 0); } catch (e) {}
  var hj = $('.hoja'); if (hj) { try { hj.focus({preventScroll: true}); } catch (e) {} }
}
function cerrarHoja(){
  S.hoja = null; S.anadiendo = null; S.borrador = ''; S.confirmar = false; S.pendienteRender = false;
  render(); try { window.scrollTo(0, 0); } catch (e) {}
  if (S.recargarAlCerrar) setTimeout(function(){ location.reload(); }, 600);
}

/* ---------- render ---------- */
function render(){
  var app = $('#app');
  if (!S.cargado) { app.innerHTML = '<div class="cargando">Cargando tus viajes…</div>'; return; }
  if (S.vista !== 'inicio' && S.vista !== 'pasados' && !viaje()) { S.vista = 'inicio'; S.hoja = null; }
  document.documentElement.classList.toggle('con-hoja', !!S.hoja);
  document.documentElement.classList.toggle('en-inicio', !S.hoja && S.vista === 'inicio');
  var der = $('.ficha-der'); if (der) S.scrollDer = {id: S.viajeId, y: der.scrollTop};
  document.documentElement.classList.toggle('en-ficha', !S.hoja && S.vista === 'viaje');
  if (S.hoja) app.innerHTML = renderHoja();
  else if (S.vista === 'viaje') {
    app.innerHTML = renderViaje();
    var cb = $('#billetes'); if (cb) cb.addEventListener('scroll', function(){ var i = Math.round(cb.scrollLeft / Math.max(1, cb.children[0].offsetWidth + 10)); Array.prototype.forEach.call(document.querySelectorAll('.punto'), function(p, k){ p.classList.toggle('on', k === i); }); }, {passive: true});
    var d2 = $('.ficha-der'); if (d2 && S.scrollDer && S.scrollDer.id === S.viajeId) d2.scrollTop = S.scrollDer.y;
  }
  else if (S.vista === 'pasados') app.innerHTML = renderPasados();
  else app.innerHTML = renderInicio();
  if (!S.hoja && S.vista === 'inicio') { montarMazo(); actualizarFondo(); completarColores(); }
  if (S.anadiendo) { var inp = $('#nuevo-item'); if (inp) { inp.value = S.borrador; inp.focus(); } }
}

/* Inicio */
function etiquetaCuenta(v){
  var h = hoy();
  if (v.inicio <= h) return 'En curso';
  var n = noches(h, v.inicio);
  return n === 1 ? 'Mañana' : 'Faltan ' + n + ' días';
}
function renderInicio(){
  var lista = pendientes();
  if (S.activo > lista.length - 1) S.activo = Math.max(0, lista.length - 1);
  var h = '<div class="pad inicio' + (lista.length ? '' : ' sin-viajes') + '">';
  h += '<div class="z-izq">';
  h += '<div class="cab-inicio z-cab"><h1>Mis viajes,<br><span class="it">por delante</span></h1>' +
       '<button class="circ lleno" data-a="nuevo" aria-label="Nuevo viaje">' + IC.mas + '</button></div>';
  if (!lista.length) {
    h += '<div class="vacio z-vacio"><span class="etiq suave">Sin viajes pendientes</span>' +
         '<h2>¿A dónde vas <span class="it">ahora</span>?</h2>' +
         '<p class="suave" style="margin:0;line-height:1.45">Crea tu próximo viaje con su título y fechas. Después podrás añadir el transporte, el itinerario y la maleta.</p>' +
         '<button class="boton b-tinta" data-a="nuevo" style="margin-top:6px">' + IC.mas + 'Crear viaje</button></div>';
  }
  if (lista.length) {
    var mazoHtml = '<div class="z-mazo"><div class="mazo" id="mazo" tabindex="0" role="region" aria-roledescription="carrusel" aria-label="Tus viajes. Desliza o usa las flechas para cambiar.">';
    lista.forEach(function(v, i){
      var len = v.titulo.length;
      var tam = len <= 6 ? 92 : len <= 9 ? 68 : 48; /* se escala con --esc-tit en pantallas grandes */
      mazoHtml += '<div class="carta t' + (i % 3) + '" data-i="' + i + '"' + estiloColor(v) + '><button class="carta-abrir" data-a="carta" data-i="' + i + '">' +
        '<span class="cuerpo"><span class="bola" aria-hidden="true"></span>' +
        '<span class="fila entre" style="position:relative"><span class="etiq">' + esc(i === 0 ? 'Próximo · ' + etiquetaCuenta(v) : etiquetaCuenta(v)) + '</span>' +
        '<span class="chip num">' + textoNoches(noches(v.inicio, v.fin)) + '</span></span>' +
        '<span class="titular" style="position:relative;min-width:0;display:block"><span style="display:block;font-size:15px;font-weight:500;overflow-wrap:anywhere">' + esc(v.subtitulo) + '</span>' +
        '<span class="titulo" style="font-size:calc(' + tam + 'px * var(--esc-tit, 1))">' + esc(v.titulo) + '</span></span>' +
        '<span class="fila entre" style="position:relative;align-items:flex-end"><span class="fechas-carta"><span style="display:block;font-size:13px">Fechas</span><span class="num" style="display:block;font-size:20px;font-weight:500">' + esc(rango(v)) + '</span></span>' +
        '<span class="flecha" aria-hidden="true">' + IC.flecha + '</span></span></span></button>' +
        '<button class="borrar-carta" data-a="borrarActivo" data-i="' + i + '" tabindex="-1" aria-label="Eliminar el viaje ' + esc(v.titulo) + '">' + IC.basura + '</button></div>';
    });
    mazoHtml += '</div></div>';
    h += '<div class="fila z-ctrl"><span class="fila" style="gap:8px">' +
         '<button class="circ" data-a="anterior" id="b-ant" aria-label="Viaje anterior">' + IC.arriba + '</button>' +
         '<button class="circ" data-a="siguiente" id="b-sig" aria-label="Viaje siguiente">' + IC.abajo + '</button></span></div>';
  }
  var p = pasados();
  h += '<div class="z-extra">';
  if (p.length) h += '<button class="pild" data-a="verPasados">Viajes pasados · ' + p.length + '</button>';
  h += '<button class="pild sin-borde" data-a="copia">Ajustes y copia de seguridad</button></div>';
  h += '</div>'; /* fin de la columna izquierda */
  if (lista.length) h += mazoHtml;
  return h + '</div>';
}
/* ---------- Color de la tarjeta a partir de la foto del viaje ---------- */
function rgbAHsl(r, g, b){
  r /= 255; g /= 255; b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, h = 0, s = 0;
  if (max !== min) {
    var d = max - min; s = l > .5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6;
  }
  return [h, s, l];
}
function hslAHex(h, s, l){
  var f = function(n){ var k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); var c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(c * 255).toString(16).padStart(2, '0'); };
  return '#' + f(0) + f(8) + f(4);
}
function luminancia(hex){
  var c = [1, 3, 5].map(function(i){ var v = parseInt(hex.substr(i, 2), 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
  return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
}
function contraste(a, b){ var x = luminancia(a), y = luminancia(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
function colorDeFoto(blob){
  return new Promise(function(ok){
    var url = URL.createObjectURL(blob), img = new Image();
    img.onload = function(){
      try {
        var N = 48, c = document.createElement('canvas'); c.width = N; c.height = N;
        var x = c.getContext('2d'); x.drawImage(img, 0, 0, N, N);
        var px = x.getImageData(0, 0, N, N).data, cubos = [];
        for (var k = 0; k < 24; k++) cubos.push({p: 0, r: 0, g: 0, b: 0});
        for (var i = 0; i < px.length; i += 4) {
          var hsl = rgbAHsl(px[i], px[i + 1], px[i + 2]);
          if (hsl[2] < .12 || hsl[2] > .92) continue;              /* casi negro o casi blanco */
          var peso = (hsl[1] * .85 + .15) * (1 - Math.abs(hsl[2] - .5));
          var cb = cubos[Math.floor(hsl[0] * 24) % 24];
          cb.p += peso; cb.r += px[i] * peso; cb.g += px[i + 1] * peso; cb.b += px[i + 2] * peso;
        }
        var mejor = cubos.reduce(function(a, b){ return b.p > a.p ? b : a; });
        URL.revokeObjectURL(url);
        if (!mejor.p) return ok(null);
        var h = rgbAHsl(mejor.r / mejor.p, mejor.g / mejor.p, mejor.b / mejor.p);
        var sat = Math.max(.28, Math.min(.72, h[1] * 1.15)), luz = Math.max(.40, Math.min(.62, h[2]));
        ok(hslAHex(h[0], sat, luz));
      } catch (e) { URL.revokeObjectURL(url); ok(null); }
    };
    img.onerror = function(){ URL.revokeObjectURL(url); ok(null); };
    img.src = url;
  });
}
/* Versión pastel del tono de la foto: mismo matiz, poca saturación y mucha luz */
function pastel(hex){
  var h = rgbAHsl(parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16));
  return {fondo: hslAHex(h[0], Math.max(.32, Math.min(.58, h[1])), .83), bola: hslAHex(h[0], Math.max(.32, Math.min(.58, h[1])), .90)};
}
function estiloColor(v){
  if (!v.color || !/^#[0-9a-f]{6}$/i.test(v.color)) return '';
  var p = pastel(v.color), tinta = '#13212A';
  return ' style="--c-fondo:' + p.fondo + ';--c-texto:' + tinta + ';--c-bola:' + p.bola + ';--c-chip:' + tinta + ';--c-chip-t:#FFFFFF"';
}
/* Calcula el color de los viajes que ya tenían foto */
var calculandoColor = {};
function completarColores(){
  if (!assets || !BD) return;
  S.viajes.forEach(function(v){
    if (!v.fotoId || v.color || calculandoColor[v.id]) return;
    calculandoColor[v.id] = true;
    assets.leer(v.fotoId).then(function(b){ return b ? colorDeFoto(b) : null; }).then(function(col){
      var actual = viaje(v.id);
      if (!col || !actual || actual.fotoId !== v.fotoId) return;
      var copia = clone(actual); copia.color = col; guardar(copia);
      if (!S.hoja && S.vista === 'inicio') render();
    }).catch(function(){});
  });
}
/* pos: posición del mazo; puede ser decimal mientras se arrastra con el dedo */
function colocarMazo(pos){
  if (typeof pos !== 'number') pos = S.activo;
  var cartas = document.querySelectorAll('.carta');
  var ALTO = cartas.length ? cartas[0].offsetHeight || 360 : 360, AS = ALTO > 400 ? 26 : 22, n = cartas.length, lista = pendientes();
  cartas.forEach(function(c, i){
    var o = i - pos, d = Math.abs(o);
    var e = 1 - 0.08 * Math.min(d, 4), ty = 0;
    if (o < 0) ty = -(AS * d) - (ALTO / 2) * (1 - e);
    if (o > 0) ty = (AS * d) + (ALTO / 2) * (1 - e);
    c.style.webkitTransform = c.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0) scale(' + e.toFixed(3) + ')';
    c.style.zIndex = String(1000 - Math.round(d * 100));
    c.style.opacity = d <= 3.2 ? '1' : '0';
    c.style.pointerEvents = d <= 3 ? 'auto' : 'none';
    var activa = i === S.activo;
    var abrir = c.querySelector('.carta-abrir'), borrar = c.querySelector('.borrar-carta');
    var t = lista[i];
    if (abrir) { abrir.tabIndex = activa ? 0 : -1; abrir.setAttribute('aria-label', (activa ? 'Abrir viaje: ' : 'Ir a ') + (t ? t.titulo : '')); }
    if (borrar) borrar.tabIndex = activa ? 0 : -1;
    c.classList.toggle('activa', activa);
  });
  if (S.confirmarInicio !== S.activo) restaurarBorrar();
  if (arguments.length === 0) actualizarFondo();
  var a = $('#b-ant'), b = $('#b-sig');
  if (a) { a.disabled = S.activo <= 0; a.style.opacity = a.disabled ? '.35' : '1'; }
  if (b) { b.disabled = S.activo >= n - 1; b.style.opacity = b.disabled ? '.35' : '1'; }
}
function restaurarBorrar(){
  S.confirmarInicio = null; clearTimeout(restaurarBorrar._t);
  document.querySelectorAll('.borrar-carta.peligro').forEach(function(b){
    b.classList.remove('peligro'); b.innerHTML = IC.basura;
    var c = b.closest('.carta'); if (c) c.classList.remove('confirmando');
  });
}
function mover(p){
  var n = pendientes().length;
  var nuevo = Math.max(0, Math.min(n - 1, S.activo + p));
  if (nuevo !== S.activo) { S.activo = nuevo; colocarMazo(); }
}
/* Arrastre: las tarjetas siguen al dedo (eventos táctiles, que Safari respeta) o al ratón */
var gesto = {y: null, t: 0, dy: 0, movido: false, rueda: 0};
var PASO = 150; /* píxeles de arrastre para pasar a la siguiente tarjeta */
function posArrastre(dy){
  var n = pendientes().length, p = S.activo - dy / PASO;
  if (p < 0) p = p * 0.3;                       /* resistencia en los extremos */
  if (p > n - 1) p = (n - 1) + (p - (n - 1)) * 0.3;
  return p;
}
function empezarArrastre(y, m){
  gesto.y = y; gesto.t = Date.now(); gesto.dy = 0; gesto.movido = false;
  m.classList.add('arrastrando');
}
function moverArrastre(y){
  if (gesto.y === null) return;
  gesto.dy = y - gesto.y;
  if (Math.abs(gesto.dy) > 6) gesto.movido = true;
  colocarMazo(posArrastre(gesto.dy));
}
function soltarArrastre(m){
  if (gesto.y === null) return;
  m.classList.remove('arrastrando');
  var dy = gesto.dy, vel = dy / Math.max(1, Date.now() - gesto.t); /* px por ms */
  gesto.y = null;
  var n = pendientes().length;
  var destino = Math.round(posArrastre(dy));
  if (destino === S.activo && Math.abs(vel) > 0.35 && Math.abs(dy) > 20) destino = S.activo + (dy < 0 ? 1 : -1);
  S.activo = Math.max(0, Math.min(n - 1, destino));
  colocarMazo();
}
function montarMazo(){
  var m = $('#mazo'); if (!m) return;
  colocarMazo();
  m.addEventListener('touchstart', function(e){
    if (e.touches.length !== 1) return;
    empezarArrastre(e.touches[0].clientY, m);
  }, {passive: true});
  m.addEventListener('touchmove', function(e){
    if (gesto.y === null) return;
    e.preventDefault();
    moverArrastre(e.touches[0].clientY);
  }, {passive: false});
  m.addEventListener('touchend', function(){ soltarArrastre(m); });
  m.addEventListener('touchcancel', function(){ soltarArrastre(m); });
  m.addEventListener('mousedown', function(e){
    if (e.button !== 0) return;
    e.preventDefault();
    empezarArrastre(e.clientY, m);
    var mv = function(ev){ moverArrastre(ev.clientY); };
    var up = function(){ window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); soltarArrastre(m); };
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', up);
  });
  m.addEventListener('wheel', function(e){
    e.preventDefault();
    var ahora = Date.now();
    if (Math.abs(e.deltaY) < 10 || ahora - gesto.rueda < 520) return;
    gesto.rueda = ahora; mover(e.deltaY > 0 ? 1 : -1);
  }, {passive: false});
  m.addEventListener('keydown', function(e){
    if (e.key === 'ArrowDown') { e.preventDefault(); mover(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1); }
  });
}

function renderPasados(){
  var h = '<div class="pad"><div class="fila" style="margin-bottom:22px"><button class="circ" data-a="inicio" aria-label="Volver">' + IC.atras + '</button>' +
          '<h1 style="font-size:28px">Viajes <span class="it">pasados</span></h1></div><div class="pasados">';
  pasados().forEach(function(v){
    h += '<button class="fila-pasado" data-a="abrir" data-id="' + esc(v.id) + '"><span style="min-width:0"><span style="display:block;font-size:20px;font-weight:500;overflow-wrap:anywhere">' + esc(v.titulo) + '</span>' +
         '<span class="suave num" style="display:block;font-size:14px;margin-top:2px">' + esc(rango(v)) + '</span></span>' + IC.flecha + '</button>';
  });
  return h + '</div></div>';
}

/* Ficha */
function tramoVista(t){
  t = t || {};
  var g = function(x){ return x && String(x).trim() ? String(x) : '—'; };
  return {
    fecha: t.fecha ? sinPunto(corto(aFecha(t.fecha))).toUpperCase() : '—',
    hora: g(t.hora), origen: g((t.origen || '').toUpperCase()), destino: g((t.destino || '').toUpperCase()),
    ciudadOrigen: g(t.ciudadOrigen), ciudadDestino: g(t.ciudadDestino), numero: g(t.numero), asiento: g(t.asiento),
    compania: g(t.compania).toUpperCase()
  };
}
/* Marcas de la maleta: por grupo y artículo (antes se guardaban por nombre y dos artículos iguales se marcaban juntos) */
function claveMarca(grupo, it){ return grupo + '::' + it; }
function marcado(m, grupo, it){ return !!(m.marcados[claveMarca(grupo, it)] || (!m.marcasV2 && m.marcados[it])); }
function migrarMarcas(m){
  if (m.marcasV2) return;
  var nuevos = {};
  m.grupos.forEach(function(g){ g.items.forEach(function(it){ if (m.marcados[it]) nuevos[claveMarca(g.nombre, it)] = true; }); });
  m.tareas.forEach(function(t){ if (m.marcados[t]) nuevos[claveMarca('__tareas', t)] = true; });
  m.marcados = nuevos; m.marcasV2 = true;
}
function conteoMaleta(v){
  var m = v.maleta || maletaBase(), tot = 0, he = 0, tt = m.tareas.length, th = 0;
  m.grupos.forEach(function(g){ g.items.forEach(function(it){ tot++; if (marcado(m, g.nombre, it)) he++; }); });
  m.tareas.forEach(function(t){ if (marcado(m, '__tareas', t)) th++; });
  return {tot: tot, he: he, tt: tt, th: th};
}
function renderViaje(){
  var v = viaje(), tr = billetes(v)[0];
  var n = noches(v.inicio, v.fin);
  var foto = fotoUrl(v.fotoId);
  var h = '<div class="ficha"><div class="cabecera" style="min-height:' + (tr ? 560 : 400) + 'px">';
  if (foto) h += '<img class="fondo" src="' + esc(foto) + '" alt="">';
  else h += '<svg class="fondo" viewBox="0 0 390 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><circle cx="290" cy="140" r="58" fill="#F07F2E" opacity=".85"/><path d="M0 330 L120 210 L200 290 L260 240 L390 350 L390 480 L0 480 Z" fill="#24404A"/><path d="M0 380 L90 320 L170 370 L270 300 L390 390 L390 480 L0 480 Z" fill="#1A3039"/></svg>';
  h += '<div class="velo"></div>';
  h += '<div class="barra"><button class="circ vidrio" data-a="inicio" aria-label="Volver a mis viajes">' + IC.atras + '</button>';
  if (assets) h += '<div class="barra-der"><button class="circ vidrio" data-a="pegarFoto" aria-label="Pegar foto de portada desde el portapapeles" title="Pegar foto">' + IC.pegar + '</button><label class="circ vidrio" style="position:relative;cursor:pointer" aria-label="Cambiar foto de portada"><input type="file" accept="image/*" id="foto" style="position:absolute;width:1px;height:1px;opacity:0">' + IC.camara + '</label></div>';
  h += '</div>';
  if (S.subiendo) h += '<div class="subiendo" role="status">Subiendo foto…</div>';
  h += '<div class="contenido"><div class="cab-titulo"><div style="min-width:0"><h1 class="t1x">' + esc(v.titulo) + '</h1>' +
       (v.subtitulo ? '<div class="t2x">' + esc(v.subtitulo) + '</div>' : '') +
       '<div class="t3x num">' + esc(rango(v)) + ' · ' + textoNoches(n) + '</div></div>' +
       '<button class="circ peq vidrio" data-a="datos" aria-label="Editar datos del viaje">' + IC.lapiz + '</button></div>';
  var lista = billetes(v);
  if (!lista.length) {
    h += '<button class="btn-transporte vidrio" data-a="transporte" aria-label="Añadir transporte">' + IC.masP + IC.coche + '</button>';
  } else {
    h += '<div class="billetes-zona"><div class="billetes' + (lista.length > 1 ? ' varios' : '') + '" id="billetes">';
    lista.forEach(function(tr, bi){
    var tx = TIPOS[tr.tipo] || TIPOS.avion, a = tramoVista(tr.ida), b = tramoVista(tr.vuelta);
    h += '<div class="billete vidrio"><div class="ida">' +
      '<div class="fila entre etiq" style="gap:10px"><span>Ida · ' + esc(a.fecha) + '</span><span style="color:var(--naranja-2);text-align:right">' + esc(a.compania) + '</span></div>' +
      '<div class="fila entre" style="gap:8px;margin-top:14px"><div style="min-width:0"><div class="cod">' + esc(a.origen) + '</div><div class="ciudad">' + esc(a.ciudadOrigen) + '</div></div>' +
      '<span class="icono-t" role="img" aria-label="' + esc(tx.nombre) + '">' + IC[tr.tipo || 'avion'] + '</span>' +
      '<div style="min-width:0;text-align:right"><div class="cod">' + esc(a.destino) + '</div><div class="ciudad">' + esc(a.ciudadDestino) + '</div></div></div>' +
      '<div class="datos"><div>Salida<b class="num">' + esc(a.hora) + '</b></div><div>' + esc(tx.numero) + '<b>' + esc(a.numero) + '</b></div><div>Asiento<b>' + esc(a.asiento) + '</b></div></div></div>' +
      '<div class="vuelta"><div style="min-width:0">' + (tieneVuelta(tr) ? '<div class="etiq num" style="color:rgba(255,255,255,.88)">Vuelta · ' + esc(b.fecha) + ' · ' + esc(b.hora) + '</div>' +
      '<div style="font-size:20px;font-weight:500;margin-top:2px">' + esc(b.origen) + ' → ' + esc(b.destino) + '</div>' : '<div class="etiq" style="color:rgba(255,255,255,.88)">Solo ida</div>') + '</div>' +
      '<button class="circ peq vidrio" style="background:transparent" data-a="transporte" data-i="' + bi + '" aria-label="Editar billete ' + (bi + 1) + '">' + IC.lapiz + '</button></div></div>';
    });
    h += '</div><div class="billetes-pie">';
    if (lista.length > 1) { h += '<div class="puntos" role="group" aria-label="Billetes">'; lista.forEach(function(_, bi){ h += '<button class="punto' + (bi === 0 ? ' on' : '') + '" data-a="irBillete" data-i="' + bi + '" aria-label="Ver billete ' + (bi + 1) + '"></button>'; }); h += '</div>'; }
    h += '<button class="mas-billete vidrio" data-a="transporte" data-i="nuevo">' + IC.masP + 'Otro billete</button></div></div>';
  }
  h += '</div></div>';

  h += '<div class="ficha-der"><div class="pad viaje-pad" style="display:flex;flex-direction:column;gap:16px;padding-top:20px">';
  var enAlo = S.pestana === 'alojamiento';
  h += '<div class="menu"><div class="pestanas" role="tablist" aria-label="Secciones del viaje">' +
       '<button class="pild' + (enAlo ? '' : ' activa') + '" role="tab" aria-selected="' + !enAlo + '" data-a="pestPlan" aria-label="Itinerario">' + IC.pin + '</button>' +
       '<button class="pild' + (enAlo ? ' activa' : '') + '" role="tab" aria-selected="' + enAlo + '" data-a="pestAlo" aria-label="Alojamiento">' + IC.casa + '</button></div>' +
       '<button class="pild" data-a="maleta" aria-label="Maleta y tareas">' + IC.maleta + '</button>' +
       '<button class="pild leer" data-a="leerReserva">' + IC.chispa + 'Leer documentos</button></div>';
  h += '<div class="cuerpo-viaje' + (enAlo ? ' ver-alo' : '') + '"><section class="sec-plan" aria-label="Itinerario">';
  var planes = (v.planes || []).slice().sort(function(x, y){ return x.dia - y.dia || (x.creado || 0) - (y.creado || 0); });
  var dias = {}; planes.forEach(function(p){ dias[p.dia] = true; });
  h += '<div class="seccion" style="margin-top:4px"><span class="tit-ia"><h2>Itinerario</h2><button class="ia-mini" data-a="leerItinerario" aria-label="Leer un itinerario desde un documento" title="Leer itinerario de un documento">' + IC.chispa + '</button><button class="ia-mini ruta-mini" data-a="editarRuta" aria-label="Añadir rutas" title="Añadir rutas">' + IC.ruta + '</button></span>' + (planes.length ? '<span class="suave num" style="font-size:14px">' + Object.keys(dias).length + ' de ' + (n + 1) + ' días con plan</span>' : '') + '</div>';
  h += '<div style="display:flex;flex-direction:column;gap:10px">';
  var llegada = false;
  // Una tarjeta por día con todos sus planes dentro; cada plan se toca para editarlo
  var rutas = v.rutas || {}, mapaDias = {};
  planes.forEach(function(p){ (mapaDias[p.dia] = mapaDias[p.dia] || []).push(p); });
  Object.keys(rutas).forEach(function(d){ if (rutas[d] && rutas[d].url) mapaDias[d] = mapaDias[d] || []; });
  var porDia = Object.keys(mapaDias).map(Number).sort(function(a, b){ return a - b; }).map(function(d){ return {dia: d, planes: mapaDias[d]}; });
  porDia.forEach(function(g){
    var d = diaFecha(v, g.dia);
    h += '<div class="plan dia-plan" role="group" aria-label="Día ' + g.dia + '"><div class="txt"><span class="suave dia-et">Día ' + g.dia + '</span><div class="dia-lista">';
    g.planes.forEach(function(p){
      var chip = '';
      if (tr && p.dia === 1 && !llegada && tr.ida && tr.ida.ciudadDestino) { chip = '<span class="llegada">' + IC.pinP + 'Llegada a ' + esc(tr.ida.ciudadDestino) + '</span>'; llegada = true; }
      h += '<button class="plan-item" data-a="editarPlan" data-id="' + esc(p.id) + '" aria-label="Editar plan: ' + esc(p.titulo) + '"><span class="lugar">' + esc(p.titulo) + '</span>' +
        (p.descripcion ? '<span class="desc">' + esc(p.descripcion) + '</span>' : '') + chip + '</button>';
    });
    var ruta = rutas[g.dia];
    h += '<div class="dia-pie">';
    if (ruta && ruta.url) h += '<div class="ruta-fila"><a class="ruta-btn" href="' + esc(ruta.url) + '" target="_blank" rel="noopener">' + IC.ruta + 'Ver ruta' + (ruta.paradas > 1 ? ' · ' + ruta.paradas + ' paradas' : '') + '</a>' +
      '<button class="ruta-editar" data-a="editarRuta" data-dia="' + g.dia + '" aria-label="Cambiar la ruta del día ' + g.dia + '">' + IC.lapiz + '</button></div>';
    else h += '<button class="ruta-anadir" data-a="editarRuta" data-dia="' + g.dia + '">' + IC.ruta + 'Añadir ruta</button>';
    h += '<button class="borrar-dia" data-a="borrarDia" data-dia="' + g.dia + '" aria-label="Eliminar el día ' + g.dia + ' entero">' + IC.basura + '</button></div>';
    h += '</div></div><span class="fecha-dia"><span class="s">' + esc(fmt(d, {weekday: 'short'}).toUpperCase()) + '</span><span class="n num">' + d.getDate() + '</span><span class="m">' + esc(fmt(d, {month: 'short'}).toUpperCase()) + '</span></span></div>';
  });
  if (!planes.length) h += '<button class="boton b-tinta" data-a="nuevoPlan" style="height:52px">' + IC.mas + 'Añadir itinerario</button>';
  else h += '<button class="dash" data-a="nuevoPlan">' + IC.mas + 'Añadir plan</button>';
  h += '</div>';
  h += '</section><section class="sec-alo" aria-label="Alojamiento">';
  var alos = (v.alojamientos || []).slice().sort(function(x, y){ return (x.entrada || '') < (y.entrada || '') ? -1 : 1; });
  h += '<div class="seccion" style="margin-top:4px"><h2>Alojamiento</h2></div><div style="display:flex;flex-direction:column;gap:10px">';
  alos.forEach(function(a){
    var f = function(x){ return x ? fmt(aFecha(x), {weekday: 'short', day: 'numeric', month: 'short'}) : '—'; };
    h += '<div class="alo">' +
      '<div class="alo-cab"><span class="alo-ic" aria-hidden="true">' + IC.casa + '</span>' +
      '<span class="alo-nombre">' + esc(a.nombre || 'Alojamiento') + '</span>' +
      '<button class="circ peq" data-a="editarAlo" data-id="' + esc(a.id) + '" aria-label="Editar alojamiento">' + IC.lapiz + '</button></div>' +
      '<div class="alo-datos">' +
        '<div><span class="etq-dato">Llegada</span><b>' + esc(f(a.entrada)) + '</b></div>' +
        '<div><span class="etq-dato">Salida</span><b>' + esc(f(a.salida)) + '</b></div>' +
        '<div><span class="etq-dato">Check-in</span><b class="num">' + esc(a.horaEntrada ? 'desde las ' + a.horaEntrada : '—') + '</b></div>' +
        '<div><span class="etq-dato">Nº de reserva</span>' + (a.codigo ? '<button class="copiar" data-a="copiar" data-t="' + esc(a.codigo) + '" aria-label="Copiar número de reserva ' + esc(a.codigo) + '"><b class="num">' + esc(a.codigo) + '</b>' + IC.copiar + '</button>' : '<b>—</b>') + '</div>' +
      '</div>' +
      (a.direccion ? '<a class="alo-mapa" href="https://www.google.com/maps/search/?api=1&amp;query=' + encodeURIComponent(a.direccion) + '" target="_blank" rel="noopener">' + IC.pin + '<span style="flex:1;min-width:0;overflow-wrap:anywhere">' + esc(a.direccion) + '</span><span class="ir">Google Maps ' + IC.flechaP + '</span></a>' : '') +
      '</div>';
  });
  if (!alos.length) h += '<button class="boton b-tinta" data-a="nuevoAlo" style="height:52px">' + IC.mas + 'Añadir alojamiento</button>';
  else h += '<button class="dash" data-a="nuevoAlo">' + IC.mas + 'Añadir otro alojamiento</button>';
  h += '</div></section>';
  var c = conteoMaleta(v);
  var pm = c.tot ? Math.round(c.he / c.tot * 100) : 0, pt = c.tt ? Math.round(c.th / c.tt * 100) : 0;
  h += '<div class="progreso sec-prog">' +
    '<button class="prog" data-a="maleta"><span class="suave" style="font-size:13px">Maleta</span><span class="grande num">' + c.he + '<span class="suave" style="font-size:16px"> / ' + c.tot + '</span></span><span class="barra-p"><i style="width:' + pm + '%;background:var(--naranja)"></i></span></button>' +
    '<button class="prog" data-a="maleta"><span class="suave" style="font-size:13px">Antes de salir</span><span class="grande num">' + c.th + '<span class="suave" style="font-size:16px"> / ' + c.tt + '</span></span><span class="barra-p"><i style="width:' + pt + '%;background:var(--tinta)"></i></span></button></div>';
  h += '</div>';
  return h + '</div></div></div>';
}

/* Hojas */
function cabHoja(titulo){
  return '<div class="hoja-cab"><h2 id="hoja-titulo" aria-level="1">' + titulo + '</h2><button class="circ peq" data-a="cerrar" aria-label="Cerrar">' + IC.x + '</button></div>';
}
function renderHoja(){
  var t = S.hoja.tipo, h = '<div class="hoja-fondo"><div class="hoja hoja-' + t + '" role="dialog" aria-modal="true" aria-labelledby="hoja-titulo" tabindex="-1">';
  if (t === 'nuevo' || t === 'datos') h += hojaDatos(t);
  else if (t === 'plan') h += hojaPlan();
  else if (t === 'transporte') h += hojaTransporte();
  else if (t === 'maleta') h += hojaMaleta();
  else if (t === 'copia') h += hojaCopia();
  else if (t === 'alojamiento') h += hojaAlo();
  else if (t === 'leyendo') h += hojaLeyendo();
  else if (t === 'revisar') h += hojaRevisar();
  else if (t === 'ruta') h += hojaRuta();
  else if (t === 'kml') h += hojaKml();
  return h + '</div></div>';
}
function avisoLeido(){
  return S.hoja && S.hoja.leido ? '<div class="dato" style="background:var(--melocoton);justify-content:flex-start">' + IC.chispa + '<span>Datos leídos de tu reserva. Revísalos antes de guardar.</span></div>' : '';
}
function hojaLeyendo(){
  return '<div class="hoja-cab"><h2 id="hoja-titulo" aria-level="1">Leyendo tus <span class="it">documentos</span></h2></div>' +
    '<div class="leyendo" role="status"><span class="giro" aria-hidden="true"></span><p style="margin:0;font-size:17px">' + (S.hoja.total > 1 ? 'Leyendo ' + S.hoja.n + ' de ' + S.hoja.total + '…' : 'Un momento…') + '</p>' +
    '<p class="suave" style="margin:0;font-size:14px;line-height:1.5;text-align:center">' + (S.hoja.itinerario ? 'La IA está sacando los planes de cada día.' : 'La IA está sacando las fechas, horas y datos del documento.') + ' Suele tardar entre 5 y 20 segundos.</p></div>' +
    '<button class="boton b-borde" data-a="cancelarLectura">Cancelar</button>';
}
function hojaAlo(){
  var a = S.hoja.alo || {};
  var h = cabHoja((a.id ? 'Editar' : 'Nuevo') + ' <span class="it">alojamiento</span>') + avisoLeido();
  var c = function(nombre, etiqueta, extra, tipo){
    return '<label class="campo-et" for="a-' + nombre + '">' + etiqueta + '<input class="campo" ' + (tipo ? 'type="' + tipo + '" ' : '') + 'id="a-' + nombre + '" name="' + nombre + '" value="' + esc(a[nombre] || '') + '"' + (extra || '') + '></label>';
  };
  h += '<form data-f="alojamiento" style="display:flex;flex-direction:column;gap:14px" novalidate>' +
    c('nombre', 'Nombre', ' maxlength="80" placeholder="Ej. Hotel Gracery Shinjuku" required') +
    '<div class="dos">' + c('entrada', 'Llegada', '', 'date') + c('salida', 'Salida', '', 'date') + '</div>' +
    c('horaEntrada', 'Check-in desde', '', 'time') +
    c('codigo', 'Nº de reserva', ' maxlength="40" inputmode="text"') +
    c('direccion', 'Ubicación', ' maxlength="160" placeholder="Dirección del alojamiento"') +
    '<p id="f-error" style="margin:0;color:var(--rojo)" hidden></p>' +
    '<div class="acciones"><button type="button" class="boton b-borde" data-a="cerrar">Cancelar</button><button type="submit" class="boton b-naranja">Guardar</button></div></form>';
  if (a.id) h += '<button class="boton b-texto" data-a="borrarAlo">' + IC.basura + 'Eliminar alojamiento</button>';
  return h;
}
function hojaCopia(){
  var tiene = !!claveIA();
  return cabHoja('<span class="it">Ajustes</span>') +
    '<h3 style="margin:6px 0 0;font-size:19px;font-weight:500">Leer documentos con IA</h3>' +
    '<p class="suave" style="margin:0;line-height:1.5">Escribe la contraseña que guardaste en Cloudflare como <b>CLAVE_APP</b>. Se guarda solo en este dispositivo y sirve para leer documentos y para sincronizar.</p>' +
    '<form data-f="claveia" style="display:flex;gap:8px;align-items:flex-end" novalidate><label class="campo-et" for="clave-ia" style="flex:1">Contraseña de la app' +
    '<input class="campo" id="clave-ia" name="clave" type="password" autocomplete="off" placeholder="' + (tiene ? '•••••••• (guardada)' : 'Tu contraseña') + '"></label>' +
    '<button type="submit" class="pild activa" style="height:48px;flex-shrink:0">Guardar</button></form>' +
    (S.hoja && S.hoja.errorClave ? '<p style="margin:0;color:var(--rojo)">La contraseña no coincide con la de Cloudflare. Escríbela de nuevo.</p>' : '') +
    '<h3 style="margin:14px 0 0;font-size:19px;font-weight:500">Sincronización</h3>' +
    '<p class="suave" style="margin:0;line-height:1.5">Tus viajes y sus fotos se mantienen iguales en todos los dispositivos donde hayas guardado la contraseña de la app.</p>' +
    '<div class="dato" style="justify-content:flex-start;gap:10px"><span class="bola-sync' + (Sync.error() ? ' mal' : '') + '" aria-hidden="true"></span><span>' + esc(Sync.texto()) + '</span></div>' +
    (tiene ? '<button class="boton b-borde" data-a="sincronizar">Sincronizar ahora</button>' : '') +
    '<h3 style="margin:14px 0 0;font-size:19px;font-weight:500">Fondo del inicio</h3>' +
    '<p class="suave" style="margin:0;line-height:1.5">Pon una foto tuya detrás de las tarjetas del inicio o vuelve al paisaje original.</p>' +
    (assets ? '<div class="acciones" style="margin-top:0"><button class="boton b-tinta" data-a="fondoFoto">Elegir foto</button><button class="boton b-borde" data-a="fondoQuitar">Fotos originales</button></div>' : '') +
    '<h3 style="margin:14px 0 0;font-size:19px;font-weight:500">Copia de seguridad</h3>' +
    '<p class="suave" style="margin:0;line-height:1.5">Por si acaso, haz una copia de vez en cuando y guárdala en Archivos o iCloud Drive.</p>' +
    '<button class="boton b-tinta" data-a="exportar">Guardar una copia</button>' +
    '<button class="boton b-borde" data-a="importar">Restaurar desde una copia</button>' +
    '<p class="suave" style="margin:0;font-size:14px;line-height:1.5">Al restaurar, los viajes de la copia se añaden a los que ya tienes; si un viaje ya existe, se sustituye por el de la copia.</p>';
}
function hojaDatos(t){
  var v = t === 'datos' ? viaje() : (S.hoja.prefill || {titulo: '', subtitulo: '', inicio: '', fin: ''});
  var h = cabHoja(t === 'nuevo' ? 'Nuevo <span class="it">viaje</span>' : 'Datos del <span class="it">viaje</span>');
  if (t === 'nuevo' && !S.hoja.leido) h += '<button class="boton b-tinta" data-a="leerReserva">' + IC.chispa + 'Rellenar desde documentos</button><p class="suave" style="margin:-4px 0 0;font-size:14px;text-align:center">PDF o foto del billete o del hotel</p>';
  if (t === 'nuevo' && S.hoja.leido) {
    var extra = S.hoja.pendiente || {};
    h += avisoLeido();
    var nb = (extra.billetes || []).length, na = (extra.alojamientos || []).length;
    if (nb || na) {
      h += '<p class="suave" style="margin:0;font-size:14px">Al crear el viaje también se ' + (nb + na === 1 ? 'guardará ' : 'guardarán ') + textoCuenta(nb, na) + ':</p><div class="rv-lista">';
      (extra.billetes || []).forEach(function(b){ h += '<div class="rv">' + filaBillete(b) + '</div>'; });
      (extra.alojamientos || []).forEach(function(x){ h += '<div class="rv">' + filaAlo(x) + '</div>'; });
      h += '</div>';
    }
  }
  h += '<form data-f="datos" style="display:flex;flex-direction:column;gap:14px" novalidate>' +
    '<label class="campo-et" for="f-titulo">Título<input class="campo" id="f-titulo" name="titulo" maxlength="40" placeholder="Ej. Japón" value="' + esc(v.titulo) + '" required></label>' +
    '<label class="campo-et" for="f-sub">Subtítulo<input class="campo" id="f-sub" name="subtitulo" maxlength="40" placeholder="Ej. Tokio · Japón" value="' + esc(v.subtitulo) + '"></label>' +
    '<div class="dos"><label class="campo-et" for="f-ini">Ida<input class="campo" type="date" id="f-ini" name="inicio" value="' + esc(v.inicio) + '" required></label>' +
    '<label class="campo-et" for="f-fin">Vuelta<input class="campo" type="date" id="f-fin" name="fin" value="' + esc(v.fin) + '" required></label></div>' +
    '<div class="dato"><span class="suave">Duración</span><span id="f-dur" style="font-weight:600;text-align:right">' + esc(duracionTexto(v.inicio, v.fin)) + '</span></div>' +
    (assets ? '<div class="campo-et">Foto del viaje<div class="fila-foto"><label class="boton b-borde" for="f-foto" style="font-weight:500;cursor:pointer">' + IC.camara + '<span id="f-foto-txt">' + (S.hoja.fotoPegada ? 'Foto pegada' : v.fotoId ? 'Cambiar foto' : 'Elegir foto') + '</span></label>' +
      '<button type="button" class="boton b-borde" data-a="pegarFotoForm" style="font-weight:500">' + IC.pegar + 'Pegar</button></div>' +
      '<input type="file" id="f-foto" name="foto" accept="image/*" hidden><span class="suave" style="font-size:13px;font-weight:400">Se verá en la cabecera del viaje y de fondo en el inicio.</span></div>' : '') +
    '<p id="f-error" class="suave" style="margin:0;color:var(--rojo)" hidden></p>' +
    '<div class="acciones"><button type="button" class="boton b-borde" data-a="cerrar">Cancelar</button><button type="submit" class="boton b-naranja">' + (t === 'nuevo' ? 'Crear viaje' : 'Guardar') + '</button></div></form>';
  if (t === 'datos') h += '<button class="boton b-texto" data-a="borrarViaje">' + IC.basura + (S.confirmar ? 'Toca otra vez para eliminar el viaje' : 'Eliminar viaje') + '</button>';
  return h;
}
/* ---------- Rutas por día ---------- */
function opcionesDias(v, elegido){
  var n = noches(v.inicio, v.fin) + 1, ops = '';
  for (var i = 1; i <= n; i++) ops += '<option value="' + i + '"' + (i === elegido ? ' selected' : '') + '>Día ' + i + ' · ' + esc(fmt(diaFecha(v, i), {weekday: 'short', day: 'numeric', month: 'short'})) + '</option>';
  return ops;
}
function hojaRuta(){
  var v = viaje(), dia = S.hoja.dia || 1, ruta = (v.rutas || {})[dia] || {};
  var h = cabHoja('Ruta del <span class="it">día</span>');
  h += '<form data-f="ruta" style="display:flex;flex-direction:column;gap:14px" novalidate>' +
    '<label class="campo-et" for="r-dia">Día<select class="campo" id="r-dia" name="dia">' + opcionesDias(v, dia) + '</select></label>' +
    '<label class="campo-et" for="r-url">Enlace de la ruta<input class="campo" id="r-url" name="url" type="url" inputmode="url" autocapitalize="off" placeholder="https://maps.app.goo.gl/…" value="' + esc(ruta.url || '') + '"></label>' +
    '<p class="suave" style="margin:-4px 0 0;font-size:14px;line-height:1.45">Pega el enlace de Google Maps (el de «Abrir ruta» o «Compartir»), de Wikiloc o de cualquier mapa.</p>' +
    '<p id="f-error" style="margin:0;color:var(--rojo)" hidden></p>' +
    '<div class="acciones"><button type="button" class="boton b-borde" data-a="cerrar">Cancelar</button><button type="submit" class="boton b-naranja">Guardar ruta</button></div></form>';
  if (ruta.url) h += '<button class="boton b-texto" data-a="quitarRuta">' + IC.basura + 'Quitar la ruta de este día</button>';
  h += '<div class="bloque-kml"><h2>¿Tienes las rutas de todo el viaje?</h2><p class="suave">Sube el archivo KML y se pondrá la ruta de cada día de una vez. También puede añadir las paradas como planes.</p>' +
    '<button class="boton b-tinta" data-a="importarKml">' + IC.ruta + 'Importar archivo KML</button></div>';
  return h;
}
/* KML: cada carpeta es un día («Día 3», «Etapa 3»… o en orden); sus puntos son las paradas */
function textoKml(el, etiqueta){ var x = el.getElementsByTagName(etiqueta)[0]; return x ? String(x.textContent || '').trim() : ''; }
function limpiarHtml(t){ return String(t || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').trim(); }
function coordsKml(t){ return String(t || '').trim().split(/\s+/).map(function(c){ var p = c.split(','); return {lng: +p[0], lat: +p[1]}; }).filter(function(p){ return isFinite(p.lat) && isFinite(p.lng); }); }
function leerKml(texto){
  var doc = new DOMParser().parseFromString(texto, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length || !doc.getElementsByTagName('Placemark').length) return null;
  var grupos = [];
  var deGrupo = function(nombre, marcas, orden){
    var m = /(d[ií]a|day|etapa|jornada)\s*(\d+)/i.exec(nombre || '');
    var g = {nombre: nombre, dia: m ? +m[2] : orden, paradas: [], linea: []};
    marcas.forEach(function(pm){
      var punto = pm.getElementsByTagName('Point')[0], linea = pm.getElementsByTagName('LineString')[0];
      if (punto) { var c = coordsKml(textoKml(punto, 'coordinates'))[0]; if (c) g.paradas.push({nombre: textoKml(pm, 'name') || 'Parada', desc: limpiarHtml(textoKml(pm, 'description')).slice(0, 600), lat: c.lat, lng: c.lng}); }
      else if (linea) g.linea = g.linea.concat(coordsKml(textoKml(linea, 'coordinates')));
    });
    if (g.paradas.length || g.linea.length > 1) grupos.push(g);
  };
  var carpetas = Array.prototype.filter.call(doc.getElementsByTagName('Folder'), function(f){
    return Array.prototype.some.call(f.children, function(c){ return c.tagName === 'Placemark'; });
  });
  if (carpetas.length) carpetas.forEach(function(f, i){
    var nombre = ''; Array.prototype.forEach.call(f.children, function(c){ if (c.tagName === 'name') nombre = String(c.textContent || '').trim(); });
    deGrupo(nombre, Array.prototype.filter.call(f.children, function(c){ return c.tagName === 'Placemark'; }), i + 1);
  });
  else {
    var porDia = {}, sinDia = [];
    Array.prototype.forEach.call(doc.getElementsByTagName('Placemark'), function(pm){
      var m = /(d[ií]a|day|etapa)\s*(\d+)/i.exec(textoKml(pm, 'name'));
      if (m) (porDia[m[2]] = porDia[m[2]] || []).push(pm); else sinDia.push(pm);
    });
    var claves = Object.keys(porDia);
    if (claves.length) claves.forEach(function(k){ deGrupo('Día ' + k, porDia[k], +k); });
    if (sinDia.length) deGrupo(textoKml(doc, 'name') || 'Ruta', sinDia, 1);
  }
  return grupos.length ? grupos : null;
}
function nombreSinDia(n){ return String(n || '').replace(/^\s*(d[ií]a|day|etapa|jornada)\s*\d+\s*[·:\-–—.,]?\s*/i, '').trim(); }
function urlRuta(g, modo){
  var pts = g.paradas.length >= 2 ? g.paradas : g.linea;
  if (pts.length < 2 && g.paradas.length === 1) return 'https://www.google.com/maps/search/?api=1&query=' + g.paradas[0].lat + ',' + g.paradas[0].lng;
  var c = function(p){ return p.lat.toFixed(6) + ',' + p.lng.toFixed(6); };
  var medio = pts.slice(1, -1), max = 8, way = [];
  for (var i = 0; i < Math.min(max, medio.length); i++) way.push(medio[Math.floor(i * medio.length / Math.min(max, medio.length))]);
  return 'https://www.google.com/maps/dir/?api=1&origin=' + c(pts[0]) + '&destination=' + c(pts[pts.length - 1]) +
    (way.length ? '&waypoints=' + encodeURIComponent(way.map(c).join('|')) : '') + '&travelmode=' + modo;
}
async function importarKml(file){
  if (/\.kmz$/i.test(file.name)) { toast('Ese archivo es KMZ. Expórtalo como KML y vuelve a intentarlo.'); return; }
  if (file.size > 15 * 1024 * 1024) { toast('Ese archivo es demasiado grande para ser un KML.'); return; }
  var grupos = null;
  try { grupos = leerKml(await file.text()); } catch (e) {}
  if (!grupos) { toast('No he encontrado rutas en ese archivo. Comprueba que sea un KML.'); return; }
  abrirHoja({tipo: 'kml', grupos: grupos, modo: 'walking', conPlanes: true});
}
function hojaKml(){
  var v = viaje(), n = noches(v.inicio, v.fin) + 1, gs = S.hoja.grupos;
  var h = cabHoja('Rutas del <span class="it">viaje</span>');
  h += '<p class="suave" style="margin:0;line-height:1.45">He encontrado ' + gs.length + (gs.length === 1 ? ' ruta' : ' rutas') + '. Cada una se pondrá en su día.</p><div class="rv-lista">';
  gs.forEach(function(g){
    var dia = Math.min(Math.max(1, g.dia), n), p = g.paradas;
    h += '<div class="rv"><span class="rv-ic">' + IC.ruta + '</span><span class="rv-txt"><b>Día ' + dia + (nombreSinDia(g.nombre) ? ' · ' + esc(nombreSinDia(g.nombre)) : '') + '</b>' +
      '<span class="suave">' + (p.length ? p.length + (p.length === 1 ? ' parada' : ' paradas') + (p.length > 1 ? ' · ' + esc(p[0].nombre) + ' → ' + esc(p[p.length - 1].nombre) : '') : 'Trazado de la ruta') + (g.dia > n ? ' · fuera de las fechas, va al último día' : '') + '</span></span></div>';
  });
  h += '</div><div class="campo-et">Cómo se recorre<div class="segm" role="radiogroup" aria-label="Cómo se recorre">';
  [['walking', 'Andando'], ['driving', 'En coche'], ['bicycling', 'En bici'], ['transit', 'Transporte']].forEach(function(m){
    h += '<span><input type="radio" name="modo" id="modo-' + m[0] + '" value="' + m[0] + '" data-a="modoKml"' + (S.hoja.modo === m[0] ? ' checked' : '') + '><label for="modo-' + m[0] + '">' + m[1] + '</label></span>';
  });
  h += '</div></div><label class="kml-planes"><input type="checkbox" id="kml-planes" data-a="planesKml"' + (S.hoja.conPlanes ? ' checked' : '') + '> Añadir las paradas como planes del itinerario</label>';
  h += '<div class="acciones"><button class="boton b-borde" data-a="cerrar">Cancelar</button><button class="boton b-naranja" data-a="guardarKml">Guardar rutas</button></div>';
  return h;
}
function hojaPlan(){
  var v = viaje(), p = S.hoja.plan, n = noches(v.inicio, v.fin) + 1;
  var h = cabHoja((p.id ? 'Editar' : 'Nuevo') + ' <span class="it">plan</span>');
  var ops = '';
  for (var i = 1; i <= n; i++) {
    var d = diaFecha(v, i);
    ops += '<option value="' + i + '"' + (i === p.dia ? ' selected' : '') + '>Día ' + i + ' · ' + esc(fmt(d, {weekday: 'short', day: 'numeric', month: 'short'})) + '</option>';
  }
  if (p.dia > n) ops += '<option value="' + p.dia + '" selected>Día ' + p.dia + ' (fuera de las fechas)</option>';
  h += '<form data-f="plan" style="display:flex;flex-direction:column;gap:14px" novalidate>' +
    '<label class="campo-et" for="p-dia">Día<select class="campo" id="p-dia" name="dia">' + ops + '</select></label>' +
    '<label class="campo-et" for="p-lugar">Lugar<input class="campo" id="p-lugar" name="titulo" maxlength="80" placeholder="Ej. Templo Senso-ji" value="' + esc(p.titulo) + '" required></label>' +
    '<label class="campo-et" for="p-desc">Descripción<textarea class="campo" id="p-desc" name="descripcion" rows="4" maxlength="600" placeholder="Qué hacer, horarios, notas…">' + esc(p.descripcion) + '</textarea></label>' +
    '<p id="f-error" style="margin:0;color:var(--rojo)" hidden></p>' +
    '<div class="acciones"><button type="button" class="boton b-borde" data-a="cerrar">Cancelar</button><button type="submit" class="boton b-naranja">Guardar plan</button></div></form>';
  if (p.id) h += '<button class="boton b-texto" data-a="borrarPlan">' + IC.basura + 'Eliminar plan</button>';
  return h;
}
function hojaTransporte(){
  var v = viaje(), lista = billetes(v), idx = S.hoja.idx, tr = (typeof idx === 'number') ? lista[idx] : null;
  var datos = S.hoja.prefill ? clone(S.hoja.prefill) : tr ? clone(tr) : {tipo: 'avion', ida: {fecha: v.inicio}, vuelta: {fecha: v.fin}};
  if (!TIPOS[datos.tipo]) datos.tipo = 'avion';
  var tx = TIPOS[datos.tipo];
  var h = cabHoja(tr ? 'Tu <span class="it">billete</span>' : (lista.length ? 'Otro <span class="it">billete</span>' : 'Tu <span class="it">transporte</span>')) + avisoLeido();
  h += '<form data-f="transporte" style="display:flex;flex-direction:column;gap:14px" novalidate><div class="segm" role="radiogroup" aria-label="Tipo de transporte">';
  ['avion', 'tren', 'bus'].forEach(function(k){
    h += '<span><input type="radio" name="tipo" id="tipo-' + k + '" value="' + k + '"' + (datos.tipo === k ? ' checked' : '') + '><label for="tipo-' + k + '">' + TIPOS[k].nombre + '</label></span>';
  });
  h += '</div>';
  [['ida', 'Ida'], ['vuelta', 'Vuelta']].forEach(function(par){
    var t = datos[par[0]] || {}, k = par[0];
    var c = function(nombre, etiqueta, extra, tipo){
      return '<label class="campo-et" for="' + k + '-' + nombre + '">' + etiqueta + '<input class="campo" ' + (tipo ? 'type="' + tipo + '" ' : '') + 'id="' + k + '-' + nombre + '" name="' + k + '_' + nombre + '" value="' + esc(t[nombre] || '') + '"' + (extra || '') + '></label>';
    };
    h += '<div class="bloque-t"><div class="etiq suave">' + par[1] + '</div><div class="dos">' +
      c('fecha', 'Fecha', '', 'date') + c('hora', 'Hora de salida', '', 'time') +
      c('origen', 'Desde (código)', ' maxlength="4" autocapitalize="characters" placeholder="MAD"') + c('ciudadOrigen', 'Ciudad', ' placeholder="Madrid"') +
      c('destino', 'Hasta (código)', ' maxlength="4" autocapitalize="characters" placeholder="HND"') + c('ciudadDestino', 'Ciudad', ' placeholder="Tokio"') +
      '<label class="campo-et" for="' + k + '-numero"><span data-l="numero">' + tx.etNumero + '</span><input class="campo" id="' + k + '-numero" name="' + k + '_numero" value="' + esc(t.numero || '') + '"></label>' +
      c('asiento', 'Asiento') + '</div>' +
      '<label class="campo-et" for="' + k + '-compania"><span data-l="compania">' + tx.compania + '</span><input class="campo" id="' + k + '-compania" name="' + k + '_compania" value="' + esc(t.compania || '') + '"></label></div>';
  });
  h += '<p id="f-error" style="margin:0;color:var(--rojo)" hidden></p><div class="acciones"><button type="button" class="boton b-borde" data-a="cerrar">Cancelar</button><button type="submit" class="boton b-naranja">Guardar</button></div></form>';
  if (tr) h += '<button class="boton b-texto" data-a="quitarTransporte">' + IC.basura + 'Quitar este billete</button>';
  return h;
}
function hojaMaleta(){
  var v = viaje(), m = v.maleta || maletaBase(), c = conteoMaleta(v);
  var pm = c.tot ? Math.round(c.he / c.tot * 100) : 0;
  var h = cabHoja('Maleta y <span class="it">tareas</span>');
  h += '<div class="maleta-cols"><div class="col-m">';
  h += '<div class="resumen-m"><div class="fila entre"><span class="etiq" style="color:var(--noche-2)">En la maleta</span><span class="num" style="font-size:14px;color:var(--noche-2)">' + pm + '% listo</span></div>' +
       '<div class="grande num">' + c.he + '<span style="font-size:18px;color:var(--noche-2)"> / ' + c.tot + ' artículos</span></div>' +
       '<div style="height:8px;border-radius:20px;background:var(--noche-3);margin-top:14px;overflow:hidden"><div style="height:8px;border-radius:20px;background:var(--naranja);width:' + pm + '%"></div></div></div>';
  var bloque = function(key, nombreHtml, lista, agua, placeholder){
    var hechos = lista.filter(function(x){ return marcado(m, key, x); }).length;
    var abierto = !S.cerrados[key];
    var s = '<div class="grupo' + (agua ? ' agua' : '') + '"><button class="grupo-cab" data-a="plegar" data-k="' + esc(key) + '" aria-expanded="' + abierto + '">' +
      '<span class="nom">' + nombreHtml + '</span><span class="suave num" style="font-size:14px">' + hechos + ' / ' + lista.length + '</span>' + (abierto ? IC.chevA : IC.chevB) + '</button>';
    if (abierto) {
      s += '<div class="grupo-lista">';
      lista.forEach(function(it, i){
        var on = marcado(m, key, it), id = 'c-' + esc(key).replace(/[^a-zA-Z0-9]/g, '') + '-' + i;
        s += '<div class="item' + (on ? ' hecho' : '') + '"><label for="' + id + '"><input type="checkbox" class="chk" id="' + id + '" data-a="marcar" data-k="' + esc(key) + '" data-n="' + esc(it) + '"' + (on ? ' checked' : '') + '><span class="txt">' + esc(it) + '</span></label>' +
             '<button class="quitar" data-a="quitarItem" data-k="' + esc(key) + '" data-i="' + i + '" aria-label="Eliminar ' + esc(it) + '">' + IC.xP + '</button></div>';
      });
      if (S.anadiendo === key) {
        s += '<form class="anadir-form" data-f="item" data-k="' + esc(key) + '"><input class="campo" id="nuevo-item" maxlength="60" aria-label="' + esc(placeholder) + '" placeholder="' + esc(placeholder) + '" enterkeyhint="done">' +
             '<button type="submit" class="pild activa" style="flex-shrink:0">Añadir</button><button type="button" class="quitar" data-a="cancelarItem" aria-label="Cancelar">' + IC.x + '</button></form>';
      } else {
        s += '<button class="anadir" data-a="empezarItem" data-k="' + esc(key) + '">' + IC.mas + 'Añadir</button>';
      }
      s += '</div>';
    }
    return s + '</div>';
  };
  m.grupos.forEach(function(g){ h += bloque(g.nombre, esc(g.nombre), g.items, false, 'Nuevo en ' + g.nombre.toLowerCase()); });
  var ptt = c.tt ? Math.round(c.th / c.tt * 100) : 0;
  h += '</div><div class="col-t"><div class="resumen-m resumen-t"><div class="fila entre"><span class="etiq">Antes de salir</span><span class="num" style="font-size:14px">' + ptt + '% hecho</span></div>' +
       '<div class="grande num">' + c.th + '<span style="font-size:18px;opacity:.7"> / ' + c.tt + ' tareas</span></div>' +
       '<div style="height:8px;border-radius:20px;background:rgba(19,33,42,.12);margin-top:14px;overflow:hidden"><div style="height:8px;border-radius:20px;background:var(--tinta);width:' + ptt + '%"></div></div></div>';
  h += bloque('__tareas', 'Antes de <span class="it">salir</span>', m.tareas, true, 'Nueva tarea');
  return h + '</div></div>';
}

/* ---------- acciones ---------- */
function editarMaleta(fn){
  var v = clone(viaje());
  v.maleta = v.maleta || maletaBase();
  migrarMarcas(v.maleta);
  fn(v.maleta);
  guardar(v);
}
var acciones = {
  nuevo: function(){ abrirHoja({tipo: 'nuevo'}); },
  copia: function(){ abrirHoja({tipo: 'copia'}); },
  sincronizar: function(){ toast('Sincronizando…'); Sync.ahora().then(function(){ toast(Sync.error() ? 'No se pudo sincronizar' : 'Sincronizado'); }); },
  fondoFoto: function(){ var i = $('#fondo-input'); i.value = ''; i.click(); },
  fondoQuitar: function(){ tx('fotos', 'readwrite', function(st){ return st.delete('fondo-inicio'); }).catch(function(){}); ponerFondo(null); toast('Fotos originales restauradas'); },
  leerItinerario: function(){
    if (!claveIA()) { abrirHoja({tipo: 'copia'}); toast('Primero guarda la contraseña de la app.'); return; }
    S.leerModo = 'itinerario'; S.leerDesde = 'viaje';
    var i = $('#reserva'); i.value = ''; i.click();
  },
  leerReserva: function(){
    if (!claveIA()) { abrirHoja({tipo: 'copia'}); toast('Primero guarda la contraseña de la app.'); return; }
    S.leerModo = null;
    S.leerDesde = S.hoja && S.hoja.tipo === 'nuevo' ? 'nuevo' : (S.vista === 'viaje' ? 'viaje' : 'nuevo');
    var i = $('#reserva'); i.value = ''; i.click();
  },
  pestPlan: function(){ S.pestana = 'plan'; render(); },
  pestAlo: function(){ S.pestana = 'alojamiento'; render(); },
  copiar: function(el){
    var t = el.dataset.t;
    var ok = function(){ toast('Número de reserva copiado'); };
    try { navigator.clipboard.writeText(t).then(ok, function(){ toast(t); }); } catch (e) { toast(t); }
  },
  nuevoAlo: function(){ var v = viaje(); abrirHoja({tipo: 'alojamiento', alo: {entrada: v.inicio, salida: v.fin}}); },
  editarAlo: function(el){
    var a = (viaje().alojamientos || []).filter(function(x){ return x.id === el.dataset.id; })[0];
    if (a) abrirHoja({tipo: 'alojamiento', alo: clone(a)});
  },
  borrarAlo: function(){
    var antes = clone(viaje()), v = clone(antes), id = S.hoja.alo.id;
    v.alojamientos = (v.alojamientos || []).filter(function(a){ return a.id !== id; });
    guardar(v); cerrarHoja(); toastDeshacer('Alojamiento eliminado', antes);
  },
  exportar: function(){ exportar(); },
  importar: function(){ var i = $('#importar'); i.value = ''; i.click(); },
  carta: function(el){
    if (gesto.movido) { gesto.movido = false; return; }
    var i = +el.dataset.i;
    if (i === S.activo) irA('viaje', {viajeId: pendientes()[i].id, pestana: 'plan'});
    else { S.activo = i; colocarMazo(); }
  },
  borrarActivo: function(el){
    var lista = pendientes(), v = lista[S.activo];
    if (!v) return;
    if (S.confirmarInicio !== S.activo) {
      S.confirmarInicio = S.activo;
      el.classList.add('peligro');
      el.innerHTML = IC.basura + '<span>¿Eliminar?</span>';
      var cc = el.closest('.carta'); if (cc) cc.classList.add('confirmando');
      toast('Toca otra vez para eliminar ' + v.titulo);
      clearTimeout(restaurarBorrar._t); restaurarBorrar._t = setTimeout(restaurarBorrar, 4000);
      return;
    }
    restaurarBorrar();
    borrarViaje(v);
    S.activo = Math.max(0, Math.min(S.activo, pendientes().length - 1));
    render(); toast('Viaje eliminado');
  },
  anterior: function(){ mover(-1); },
  saltar: function(el){ S.activo = +el.dataset.i; colocarMazo(); },
  siguiente: function(){ mover(1); },
  verPasados: function(){ irA('pasados'); },
  abrir: function(el){ irA('viaje', {viajeId: el.dataset.id, pestana: 'plan'}); },
  inicio: function(){ irA('inicio'); },
  cerrar: cerrarHoja,
  datos: function(){ abrirHoja({tipo: 'datos'}); },
  transporte: function(el){
    var i = el && el.dataset ? el.dataset.i : undefined;
    var n = billetes(viaje()).length;
    abrirHoja({tipo: 'transporte', idx: (i === undefined || i === 'nuevo') ? (i === 'nuevo' || !n ? null : 0) : parseInt(i, 10)});
  },
  cancelarLectura: function(){ lectura.cancelada = true; if (lectura.ctrl) try { lectura.ctrl.abort(); } catch (e) {} },
  quitarLeido: function(el){ var l = el.dataset.k === 'b' ? S.hoja.billetes : S.hoja.alojamientos; l.splice(+el.dataset.i, 1); render(); },
  guardarLeido: function(){
    var v = clone(viaje()), bs = S.hoja.billetes, als = S.hoja.alojamientos;
    ponerBilletes(v, billetes(v).concat(bs));
    v.alojamientos = (v.alojamientos || []).concat(als);
    guardar(v); cerrarHoja(); toast('Guardado: ' + textoCuenta(bs.length, als.length));
  },
  irBillete: function(el){ var c = $('#billetes'), b = c && c.children[+el.dataset.i]; if (b) c.scrollTo({left: b.offsetLeft - c.offsetLeft, behavior: 'smooth'}); },
  maleta: function(){
    var v = viaje(), m = v.maleta || maletaBase(), c = {__tareas: true};
    m.grupos.forEach(function(g){ c[g.nombre] = true; });
    S.cerrados = c; S.anadiendo = null; S.borrador = '';
    abrirHoja({tipo: 'maleta'});
  },
  nuevoPlan: function(){
    var v = viaje(), total = noches(v.inicio, v.fin) + 1, ocupados = {};
    (v.planes || []).forEach(function(p){ ocupados[p.dia] = true; });
    var d = 1; while (ocupados[d] && d < total) d++;
    abrirHoja({tipo: 'plan', plan: {id: null, dia: d, titulo: '', descripcion: ''}});
  },
  pegarFoto: function(){ imagenDelPortapapeles().then(function(b){ subirFoto(b); }).catch(avisoPegar); },
  pegarFotoForm: function(){ imagenDelPortapapeles().then(fotoPegadaEnFormulario).catch(avisoPegar); },
  editarRuta: function(el){
    var v = viaje(), d = el && el.dataset && el.dataset.dia ? +el.dataset.dia : 0;
    if (!d) { var n = noches(v.inicio, v.fin) + 1, r = v.rutas || {}; d = 1; while (r[d] && r[d].url && d < n) d++; }
    abrirHoja({tipo: 'ruta', dia: d});
  },
  borrarDia: function(el){
    var dia = +el.dataset.dia, antes = clone(viaje()), v = clone(antes);
    var n = (v.planes || []).filter(function(p){ return p.dia === dia; }).length;
    v.planes = (v.planes || []).filter(function(p){ return p.dia !== dia; });
    if (v.rutas) delete v.rutas[dia];
    guardar(v); render();
    toastDeshacer('Día ' + dia + ' eliminado' + (n ? ' (' + n + (n === 1 ? ' plan)' : ' planes)') : ''), antes);
  },
  quitarRuta: function(){
    var antes = clone(viaje()), v = clone(antes); v.rutas = v.rutas || {}; delete v.rutas[S.hoja.dia];
    guardar(v); cerrarHoja(); toastDeshacer('Ruta quitada', antes);
  },
  importarKml: function(){ var i = $('#kml'); i.value = ''; i.click(); },
  guardarKml: function(){
    var v = clone(viaje()), n = noches(v.inicio, v.fin) + 1, modo = S.hoja.modo, conPlanes = S.hoja.conPlanes, ya = {}, base = Date.now(), np = 0;
    v.rutas = v.rutas || {}; v.planes = v.planes || [];
    v.planes.forEach(function(p){ ya[p.dia + '|' + String(p.titulo).toLowerCase()] = 1; });
    S.hoja.grupos.forEach(function(g, gi){
      var dia = Math.min(Math.max(1, g.dia), n);
      v.rutas[dia] = {url: urlRuta(g, modo), nombre: nombreSinDia(g.nombre), paradas: g.paradas.length};
      if (conPlanes) g.paradas.forEach(function(p, i){
        var c = dia + '|' + p.nombre.toLowerCase(); if (ya[c]) return; ya[c] = 1;
        v.planes.push({id: nuevoId('p'), creado: base + gi * 100 + i, dia: dia, titulo: p.nombre.slice(0, 80), descripcion: p.desc}); np++;
      });
    });
    var nr = S.hoja.grupos.length;
    guardar(v); S.pestana = 'plan'; cerrarHoja();
    toast((nr === 1 ? '1 ruta guardada' : nr + ' rutas guardadas') + (np ? ' y ' + np + (np === 1 ? ' plan añadido' : ' planes añadidos') : ''));
  },
  editarPlan: function(el){
    var p = (viaje().planes || []).filter(function(x){ return x.id === el.dataset.id; })[0];
    if (p) abrirHoja({tipo: 'plan', plan: clone(p)});
  },
  borrarPlan: function(){
    var antes = clone(viaje()), v = clone(antes), id = S.hoja.plan.id;
    v.planes = (v.planes || []).filter(function(p){ return p.id !== id; });
    guardar(v); cerrarHoja(); toastDeshacer('Plan eliminado', antes);
  },
  quitarTransporte: function(){ var antes = clone(viaje()), v = clone(antes), l = billetes(v).slice(); if (typeof S.hoja.idx === 'number') l.splice(S.hoja.idx, 1); ponerBilletes(v, l); guardar(v); cerrarHoja(); toastDeshacer('Billete eliminado', antes); },
  borrarViaje: function(){
    if (!S.confirmar) { S.confirmar = true; render(); return; }
    var v = viaje(); borrarViaje(v); S.activo = 0; irA('inicio'); toast('Viaje eliminado');
  },
  plegar: function(el){ var k = el.dataset.k; S.cerrados[k] = !S.cerrados[k]; if (S.anadiendo === k) S.anadiendo = null; render(); },
  empezarItem: function(el){ S.anadiendo = el.dataset.k; S.borrador = ''; render(); },
  cancelarItem: function(){ S.anadiendo = null; S.borrador = ''; render(); },
  quitarItem: function(el){
    var k = el.dataset.k, i = +el.dataset.i, antes = clone(viaje());
    editarMaleta(function(m){
      var lista = k === '__tareas' ? m.tareas : ((m.grupos.filter(function(g){ return g.nombre === k; })[0] || {}).items || []);
      if (lista[i] != null) delete m.marcados[claveMarca(k, lista[i])];
      var fuera = function(l){ return l.filter(function(_, j){ return j !== i; }); };
      if (k === '__tareas') m.tareas = fuera(m.tareas);
      else m.grupos.forEach(function(g){ if (g.nombre === k) g.items = fuera(g.items); });
    });
    render();
    toastDeshacer('Artículo eliminado', antes);
  }
};

var app = $('#app');
app.addEventListener('click', function(e){
  var el = e.target.closest('[data-a]');
  if (!el || el.tagName === 'INPUT') return;
  var fn = acciones[el.dataset.a];
  if (fn) { e.preventDefault(); fn(el); }
});
app.addEventListener('change', function(e){
  var el = e.target;
  if (el.dataset && el.dataset.a === 'marcar') {
    var nombre = el.dataset.n;
    var cm = claveMarca(el.dataset.k, nombre);
    editarMaleta(function(m){ if (m.marcados[cm]) delete m.marcados[cm]; else m.marcados[cm] = true; });
    render(); var again = document.getElementById(el.id); if (again) again.focus();
  } else if (el.id === 'foto' && el.files && el.files[0]) {
    subirFoto(el.files[0]);
  } else if (el.id === 'r-dia' && S.hoja && S.hoja.tipo === 'ruta') {
    S.hoja.dia = +el.value; render();
  } else if (el.dataset && el.dataset.a === 'modoKml') {
    S.hoja.modo = el.value;
  } else if (el.id === 'kml-planes') {
    S.hoja.conPlanes = el.checked;
  } else if (el.id === 'f-foto') {
    var tf = $('#f-foto-txt'); if (tf && el.files && el.files[0]) { tf.textContent = el.files[0].name; if (S.hoja) S.hoja.fotoPegada = null; }
  } else if (el.name === 'tipo') {
    var tx = TIPOS[el.value];
    document.querySelectorAll('[data-l="numero"]').forEach(function(s){ s.textContent = tx.etNumero; });
    document.querySelectorAll('[data-l="compania"]').forEach(function(s){ s.textContent = tx.compania; });
  }
});
app.addEventListener('input', function(e){
  var el = e.target;
  if (el.id === 'nuevo-item') S.borrador = el.value;
  if (el.id === 'f-ini' || el.id === 'f-fin') {
    var ini = $('#f-ini'), fin = $('#f-fin');
    if (el.id === 'f-ini' && ini.value) { fin.min = ini.value; if (fin.value && fin.value < ini.value) fin.value = ini.value; }
    $('#f-dur').textContent = duracionTexto(ini.value, fin.value);
  }
});
app.addEventListener('submit', function(e){
  e.preventDefault();
  var f = e.target, tipo = f.dataset.f, fd = new FormData(f);
  var val = function(k){ return String(fd.get(k) || '').trim(); };
  var error = function(t){ var p = $('#f-error'); if (p) { p.textContent = t; p.hidden = false; } };
  if (tipo === 'datos') {
    var pegada = S.hoja && S.hoja.fotoPegada;
    var d = {titulo: val('titulo'), subtitulo: val('subtitulo'), inicio: val('inicio'), fin: val('fin')};
    if (!d.titulo) return error('Escribe un título para el viaje.');
    if (!d.inicio || !d.fin) return error('Elige la fecha de ida y la de vuelta.');
    if (d.fin < d.inicio) return error('La vuelta no puede ser antes que la ida.');
    if (S.hoja.tipo === 'nuevo') {
      var pend = S.hoja.pendiente || {};
      var nv = {id: nuevoId('v'), titulo: d.titulo, subtitulo: d.subtitulo, inicio: d.inicio, fin: d.fin, transporte: null, billetes: [], alojamientos: pend.alojamientos || (pend.alojamiento ? [pend.alojamiento] : []), planes: [], maleta: maletaBase(), fotoId: null, creado: Date.now()};
      ponerBilletes(nv, pend.billetes || (pend.transporte ? [pend.transporte] : []));
      guardar(nv);
      var fotoNueva = fd.get('foto');
      if (fotoNueva && fotoNueva.size) subirFoto(fotoNueva, nv.id); else if (pegada) subirFoto(pegada, nv.id);
      var lista = pendientes(); var pos = lista.findIndex(function(x){ return x.id === nv.id; });
      S.activo = pos < 0 ? 0 : pos;
      irA('inicio');
      if (pos < 0) toast('Viaje guardado en Viajes pasados');
    } else {
      var v = clone(viaje());
      v.titulo = d.titulo; v.subtitulo = d.subtitulo; v.inicio = d.inicio; v.fin = d.fin;
      var ultimoDia = noches(d.inicio, d.fin) + 1, movidos = 0;
      (v.planes || []).forEach(function(p){ if (p.dia > ultimoDia) { p.dia = ultimoDia; movidos++; } });
      guardar(v); cerrarHoja();
      if (movidos) toast(movidos === 1 ? '1 plan pasado al último día del viaje' : movidos + ' planes pasados al último día del viaje');
      var fotoCambio = fd.get('foto');
      if (fotoCambio && fotoCambio.size) subirFoto(fotoCambio, v.id); else if (pegada) subirFoto(pegada, v.id);
    }
  } else if (tipo === 'ruta') {
    var url = val('url'), diaR = parseInt(fd.get('dia'), 10) || 1;
    if (!/^https?:\/\/\S+\.\S+/i.test(url)) return error('Pega un enlace que empiece por https://');
    var vr = clone(viaje()); vr.rutas = vr.rutas || {};
    var previa = vr.rutas[diaR] || {};
    vr.rutas[diaR] = previa.url === url ? previa : {url: url};
    guardar(vr); cerrarHoja(); toast('Ruta del día ' + diaR + ' guardada');
  } else if (tipo === 'plan') {
    var titulo = val('titulo');
    if (!titulo) return error('Escribe el lugar o la actividad.');
    var v2 = clone(viaje()), p = S.hoja.plan;
    var datos = {dia: parseInt(fd.get('dia'), 10) || 1, titulo: titulo, descripcion: val('descripcion')};
    v2.planes = v2.planes || [];
    if (p.id) v2.planes = v2.planes.map(function(x){ return x.id === p.id ? Object.assign(x, datos) : x; });
    else v2.planes.push(Object.assign({id: nuevoId('p'), creado: Date.now()}, datos));
    guardar(v2); cerrarHoja();
  } else if (tipo === 'transporte') {
    var v3 = clone(viaje());
    var tramo = function(k){
      return {fecha: val(k + '_fecha'), hora: val(k + '_hora'), origen: val(k + '_origen').toUpperCase(), ciudadOrigen: val(k + '_ciudadOrigen'),
              destino: val(k + '_destino').toUpperCase(), ciudadDestino: val(k + '_ciudadDestino'), numero: val(k + '_numero'), asiento: val(k + '_asiento'), compania: val(k + '_compania')};
    };
    var nb = {tipo: val('tipo') || 'avion', ida: tramo('ida'), vuelta: tramo('vuelta')}, lb = billetes(v3).slice();
    if (!nb.ida.origen && !nb.ida.destino && !nb.ida.ciudadOrigen && !nb.ida.ciudadDestino && !nb.ida.numero) return error('Escribe al menos el origen o el destino de la ida.');
    if (typeof S.hoja.idx === 'number' && lb[S.hoja.idx]) lb[S.hoja.idx] = nb; else lb.push(nb);
    ponerBilletes(v3, lb);
    guardar(v3); cerrarHoja();
  } else if (tipo === 'alojamiento') {
    var nombre = val('nombre');
    if (!nombre) return error('Escribe el nombre del alojamiento.');
    var ent = val('entrada'), sal = val('salida');
    if (ent && sal && sal < ent) return error('La salida no puede ser antes que la entrada.');
    var v4 = clone(viaje()), a0 = S.hoja.alo || {};
    var alo = Object.assign({}, a0, {id: a0.id || nuevoId('a'), nombre: nombre, direccion: val('direccion'), entrada: ent, salida: sal, horaEntrada: val('horaEntrada'), codigo: val('codigo')});
    v4.alojamientos = (v4.alojamientos || []).filter(function(x){ return x.id !== alo.id; }).concat([alo]);
    guardar(v4); S.pestana = 'alojamiento'; cerrarHoja();
  } else if (tipo === 'claveia') {
    var clave = String(fd.get('clave') || '').trim();
    if (!clave) return;
    try { localStorage.setItem(LS_CLAVE_IA, clave); } catch (e2) {}
    S.hoja.errorClave = false; render(); toast('Contraseña guardada'); Sync.programar(200);
  } else if (tipo === 'item') {
    var texto = (S.borrador || '').trim(), k = f.dataset.k;
    if (!texto) return;
    editarMaleta(function(m){
      if (k === '__tareas') { if (m.tareas.indexOf(texto) < 0) m.tareas.push(texto); }
      else m.grupos.forEach(function(g){ if (g.nombre === k && g.items.indexOf(texto) < 0) g.items.push(texto); });
    });
    S.borrador = ''; render();
  }
});
var tRedim;
window.addEventListener('resize', function(){ clearTimeout(tRedim); tRedim = setTimeout(function(){ if (!S.hoja && S.vista === 'inicio') { colocarMazo(); actualizarFondo(true); } }, 120); });
$('#importar').addEventListener('change', function(e){ var f = e.target.files && e.target.files[0]; if (f) importar(f); });
$('#fondo-input').addEventListener('change', function(e){ var f = e.target.files && e.target.files[0]; if (f) cambiarFondo(f); });
$('#kml').addEventListener('change', function(e){ var f = e.target.files && e.target.files[0]; if (f) importarKml(f); });
$('#reserva').addEventListener('change', function(e){ var fs = e.target.files ? Array.prototype.slice.call(e.target.files, 0, 10) : []; if (fs.length) { if (S.leerModo === 'itinerario') procesarItinerario(fs); else procesarReserva(fs); } });

/* ---------- leer reservas con IA ---------- */
function aBase64(blob){
  return new Promise(function(ok, ko){
    var r = new FileReader();
    r.onload = function(){ var s = String(r.result); ok(s.slice(s.indexOf(',') + 1)); };
    r.onerror = function(){ ko(new Error('leer')); };
    r.readAsDataURL(blob);
  });
}
function limpio(o){ var r = {}; for (var k in (o || {})) { if (o[k] != null && String(o[k]).trim() !== '') r[k] = String(o[k]).trim(); } return r; }
function mensajeError(res){
  if (res.error === 'demasiadas_peticiones') return 'Demasiadas peticiones seguidas. Espera un minuto y vuelve a intentarlo.';
  return res.error === 'ia' && /credit|balance/i.test(res.detalle || '') ? 'Tu saldo de Claude se ha agotado. Recárgalo en la consola de Claude.' :
         res.error === 'ia' && res.estado === 400 ? 'La IA no pudo abrir ese archivo. Prueba con otro PDF o una foto.' :
         res.error === 'demasiado_grande' ? 'El archivo es demasiado grande.' :
         res.error === 'falta_clave_ia' || (res.error === 'ia' && (res.estado === 401 || res.estado === 403)) ? 'La clave de Claude guardada en Cloudflare no es válida.' :
         'No se pudo leer la reserva. Revisa la conexión y vuelve a intentarlo.';
}
var lectura = {ctrl: null, cancelada: false};
async function leerUno(file, extra){
  var esPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (esPdf && file.size > 10 * 1024 * 1024) return {error: 'El PDF «' + file.name + '» pesa más de 10 MB.'};
  var blob = esPdf ? file : await reducir(file);
  var cuerpo = Object.assign({archivo: await aBase64(blob), tipo: esPdf ? 'application/pdf' : 'image/jpeg'}, extra || {});
  if (lectura.cancelada) return {cancelada: true};
  lectura.ctrl = window.AbortController ? new AbortController() : null;
  var tLimite = setTimeout(function(){ if (lectura.ctrl) { lectura.porTiempo = true; lectura.ctrl.abort(); } }, 90000);
  var r;
  try { r = await fetch(CONSERJE, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Clave-App': claveIA()}, body: JSON.stringify(cuerpo), signal: lectura.ctrl ? lectura.ctrl.signal : undefined}); }
  catch (e) {
    clearTimeout(tLimite);
    if (lectura.cancelada) return {cancelada: true};
    if (lectura.porTiempo) { lectura.porTiempo = false; return {error: 'La lectura ha tardado demasiado. Revisa la conexión y vuelve a intentarlo.'}; }
    throw e;
  }
  clearTimeout(tLimite);
  var res = {}; try { res = await r.json(); } catch (e) {}
  if (r.status === 401) return {clave: true};
  if (!r.ok || !res.ok || !res.datos) return {error: mensajeError(res)};
  return {datos: res.datos};
}
function limpiarBillete(t){
  if (!t) return null;
  var b = {tipo: TIPOS[t.tipo] ? t.tipo : 'avion', ida: limpio(t.ida), vuelta: limpio(t.vuelta)};
  ['ida', 'vuelta'].forEach(function(k){ if (b[k].origen) b[k].origen = b[k].origen.toUpperCase().slice(0, 4); if (b[k].destino) b[k].destino = b[k].destino.toUpperCase().slice(0, 4); });
  var ok = function(x){ return !!(x.origen || x.destino || x.fecha || x.numero); };
  if (!ok(b.ida) && ok(b.vuelta)) { b.ida = b.vuelta; b.vuelta = {}; }
  if (!ok(b.ida)) return null;
  if (!ok(b.vuelta)) b.vuelta = {};
  return b;
}
function claveBillete(b){ return [b.ida.fecha, b.ida.origen, b.ida.destino, b.ida.numero, b.vuelta.fecha, b.vuelta.origen].join('|'); }
async function procesarReserva(files){
  lectura.cancelada = false; lectura.porTiempo = false;
  var desde = S.leerDesde, hojaAntes = S.hoja, viajeId = S.viajeId;
  var volver = function(){ if (hojaAntes) { S.hoja = hojaAntes; render(); } else cerrarHoja(); };
  var bs = [], als = [], vg = {}, errores = [], vistos = {};
  for (var k = 0; k < files.length; k++) {
    abrirHoja({tipo: 'leyendo', n: k + 1, total: files.length});
    var r;
    try { r = await leerUno(files[k]); } catch (e) { r = {error: 'No se pudo leer la reserva. Revisa la conexión y vuelve a intentarlo.'}; }
    if (r.cancelada) { volver(); toast('Lectura cancelada'); return; }
    if (r.clave) { abrirHoja({tipo: 'copia', errorClave: true}); return; }
    if (r.error) { errores.push(r.error); continue; }
    var d = r.datos;
    var lb = Array.isArray(d.billetes) && d.billetes.length ? d.billetes : (d.transporte ? [d.transporte] : []);
    var la = Array.isArray(d.alojamientos) && d.alojamientos.length ? d.alojamientos : (d.alojamiento ? [d.alojamiento] : []);
    lb.forEach(function(t){ var b = limpiarBillete(t); if (b && !vistos[claveBillete(b)]) { vistos[claveBillete(b)] = 1; bs.push(b); } });
    la.forEach(function(a){ if (a && a.nombre) { var x = limpio(a); x.id = nuevoId('a'); als.push(x); } });
    if (!vg.titulo && d.viaje) vg = limpio(d.viaje);
  }
  if (!bs.length && !als.length) {
    volver();
    toast(errores.length ? errores[errores.length - 1] : 'No he encontrado billetes ni alojamientos en ' + (files.length > 1 ? 'esos archivos.' : 'ese archivo.'));
    return;
  }
  if (errores.length) toast(errores.length === 1 ? 'Un archivo no se pudo leer; el resto sí.' : errores.length + ' archivos no se pudieron leer; el resto sí.');
  bs = ordenarBilletes(bs);
  if (desde === 'viaje' && viajeId) {
    S.viajeId = viajeId; S.vista = 'viaje';
    var ya = {}; billetes(viaje(viajeId)).forEach(function(x){ var c = limpiarBillete(x); if (c) ya[claveBillete(c)] = 1; });
    var nombresYa = {}; (viaje(viajeId).alojamientos || []).forEach(function(x){ nombresYa[(x.nombre || '').toLowerCase() + '|' + (x.entrada || '')] = 1; });
    var antes = bs.length + als.length;
    bs = bs.filter(function(x){ return !ya[claveBillete(x)]; });
    als = als.filter(function(x){ return !nombresYa[(x.nombre || '').toLowerCase() + '|' + (x.entrada || '')]; });
    if (!bs.length && !als.length) { cerrarHoja(); toast(antes === 1 ? 'Esa reserva ya estaba guardada en este viaje.' : 'Esas reservas ya estaban guardadas en este viaje.'); return; }
    if (bs.length === 1 && !als.length) abrirHoja({tipo: 'transporte', prefill: bs[0], leido: true, idx: null});
    else if (als.length === 1 && !bs.length) abrirHoja({tipo: 'alojamiento', alo: als[0], leido: true});
    else abrirHoja({tipo: 'revisar', billetes: bs, alojamientos: als, leido: true});
    return;
  }
  var fechas = [];
  bs.forEach(function(b){ if (b.ida.fecha) fechas.push(b.ida.fecha); if (b.vuelta.fecha) fechas.push(b.vuelta.fecha); });
  als.forEach(function(a){ if (a.entrada) fechas.push(a.entrada); if (a.salida) fechas.push(a.salida); });
  fechas.sort();
  var inicio = vg.inicio || fechas[0] || '', fin = vg.fin || fechas[fechas.length - 1] || inicio;
  var destino = bs.length ? (bs[0].vuelta.origen ? bs[0].ida.ciudadDestino : bs[bs.length - 1].ida.ciudadDestino) : '';
  abrirHoja({tipo: 'nuevo', leido: true, prefill: {titulo: vg.titulo || destino || '', subtitulo: vg.subtitulo || '', inicio: inicio, fin: fin}, pendiente: {billetes: bs, alojamientos: als}});
}
async function procesarItinerario(files){
  lectura.cancelada = false; lectura.porTiempo = false;
  var viajeId = S.viajeId, v0 = viaje(viajeId);
  if (!v0) return;
  var hojaAntes = S.hoja, total = noches(v0.inicio, v0.fin) + 1, nuevos = [], errores = [], sinPlanes = 0;
  for (var k = 0; k < files.length; k++) {
    abrirHoja({tipo: 'leyendo', n: k + 1, total: files.length, itinerario: true});
    var r;
    try { r = await leerUno(files[k], {modo: 'itinerario', inicio: v0.inicio, fin: v0.fin, destino: [v0.titulo, v0.subtitulo].filter(Boolean).join(' · ')}); }
    catch (e) { r = {error: 'No se pudo leer el documento. Revisa la conexión y vuelve a intentarlo.'}; }
    if (r.cancelada) { S.hoja = null; render(); toast('Lectura cancelada'); return; }
    if (r.clave) { abrirHoja({tipo: 'copia', errorClave: true}); return; }
    if (r.error) { errores.push(r.error); continue; }
    var ps = (r.datos && Array.isArray(r.datos.planes)) ? r.datos.planes : [];
    if (!ps.length) sinPlanes++;
    ps.forEach(function(p){
      var titulo = String(p.titulo || '').trim(); if (!titulo) return;
      var dia = parseInt(p.dia, 10);
      if (p.fecha && /^\d{4}-\d{2}-\d{2}$/.test(p.fecha)) dia = noches(v0.inicio, p.fecha) + 1;
      if (!(dia >= 1)) dia = 1; if (dia > total) dia = total;
      nuevos.push({dia: dia, titulo: titulo.slice(0, 120), descripcion: String(p.descripcion || '').trim().slice(0, 600)});
    });
  }
  S.viajeId = viajeId; S.vista = 'viaje'; S.pestana = 'plan';
  if (!nuevos.length) {
    S.hoja = null; render();
    toast(errores.length && !sinPlanes ? errores[errores.length - 1] : 'No he encontrado planes de itinerario en ' + (files.length > 1 ? 'esos documentos.' : 'ese documento.'));
    return;
  }
  var v = clone(viaje(viajeId)), ya = {}, base = Date.now(), anadidos = 0;
  v.planes = v.planes || [];
  v.planes.forEach(function(p){ ya[p.dia + '|' + p.titulo.toLowerCase()] = 1; });
  nuevos.forEach(function(p, i){
    var c = p.dia + '|' + p.titulo.toLowerCase(); if (ya[c]) return; ya[c] = 1;
    v.planes.push(Object.assign({id: nuevoId('p'), creado: base + i}, p)); anadidos++;
  });
  guardar(v); S.hoja = null; render();
  toast(anadidos ? (anadidos === 1 ? 'Añadido 1 plan al itinerario' : 'Añadidos ' + anadidos + ' planes al itinerario') + (errores.length ? ' (algún archivo no se pudo leer)' : '') : 'Esos planes ya estaban en tu itinerario.');
}
function textoCuenta(nb, na){
  var p = [];
  if (nb) p.push(nb === 1 ? '1 billete' : nb + ' billetes');
  if (na) p.push(na === 1 ? '1 alojamiento' : na + ' alojamientos');
  return p.join(' y ');
}
function filaBillete(b){
  var a = tramoVista(b.ida), v = tramoVista(b.vuelta);
  return '<span class="rv-ic">' + IC[b.tipo || 'avion'] + '</span><span class="rv-txt"><b>' + esc(a.origen) + ' → ' + esc(a.destino) + '</b>' +
    '<span class="suave">' + esc(a.fecha) + ' · ' + esc(a.hora) + (b.ida.numero ? ' · ' + esc(b.ida.numero) : '') + '</span>' +
    (tieneVuelta(b) ? '<span class="suave">Vuelta ' + esc(v.fecha) + ' · ' + esc(v.origen) + ' → ' + esc(v.destino) + '</span>' : '') + '</span>';
}
function filaAlo(x){
  var f = function(d){ return d ? fmt(aFecha(d), {day: 'numeric', month: 'short'}) : '—'; };
  return '<span class="rv-ic">' + IC.casa + '</span><span class="rv-txt"><b>' + esc(x.nombre) + '</b><span class="suave">' + esc(f(x.entrada)) + ' — ' + esc(f(x.salida)) + '</span></span>';
}
function hojaRevisar(){
  var bs = S.hoja.billetes, als = S.hoja.alojamientos;
  var h = cabHoja('He encontrado <span class="it">' + esc(textoCuenta(bs.length, als.length) || 'nada') + '</span>') + avisoLeido();
  if (bs.length) {
    h += '<div class="etiq suave" style="margin-top:4px">Billetes</div><div class="rv-lista">';
    bs.forEach(function(b, i){ h += '<div class="rv">' + filaBillete(b) + '<button class="quitar" data-a="quitarLeido" data-k="b" data-i="' + i + '" aria-label="Quitar este billete">' + IC.xP + '</button></div>'; });
    h += '</div>';
  }
  if (als.length) {
    h += '<div class="etiq suave" style="margin-top:4px">Alojamientos</div><div class="rv-lista">';
    als.forEach(function(x, i){ h += '<div class="rv">' + filaAlo(x) + '<button class="quitar" data-a="quitarLeido" data-k="a" data-i="' + i + '" aria-label="Quitar este alojamiento">' + IC.xP + '</button></div>'; });
    h += '</div>';
  }
  h += '<p class="suave" style="margin:0;font-size:14px;line-height:1.45">Quita lo que no quieras guardar. Después podrás editar cada billete con su lápiz.</p>';
  h += '<div class="acciones"><button class="boton b-borde" data-a="cerrar">Cancelar</button><button class="boton b-naranja" data-a="guardarLeido"' + (bs.length + als.length ? '' : ' disabled') + '>Guardar todo</button></div>';
  return h;
}
app.addEventListener('keydown', function(e){
  if (e.key === 'Escape' && S.anadiendo) { S.anadiendo = null; S.borrador = ''; render(); return; }
  if (e.key === 'Escape' && S.hoja && S.hoja.tipo !== 'leyendo') { e.preventDefault(); var vuelta = S.focoAntes; cerrarHoja(); if (vuelta && document.contains(vuelta)) vuelta.focus(); }
});

/* ---------- foto de portada ---------- */
function reducir(file){
  return new Promise(function(ok, ko){
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function(){
      var max = 1600, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
      var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(function(b){ b ? ok(b) : ko(new Error('canvas')); }, 'image/jpeg', 0.8);
    };
    img.onerror = function(){ URL.revokeObjectURL(url); ko(new Error('img')); };
    img.src = url;
  });
}
/* Pegar una imagen copiada (sin tener que descargarla) */
async function imagenDelPortapapeles(){
  if (!navigator.clipboard || !navigator.clipboard.read) throw {code: 'sin_api'};
  var items = await navigator.clipboard.read();
  for (var i = 0; i < items.length; i++) {
    var tipo = items[i].types.filter(function(t){ return /^image\//.test(t); })[0];
    if (tipo) return await items[i].getType(tipo);
  }
  throw {code: 'sin_imagen'};
}
function avisoPegar(e){
  var c = e && (e.code || e.name);
  toast(c === 'sin_imagen' ? 'No hay ninguna imagen copiada. Mantén pulsada una foto, toca «Copiar» y vuelve a intentarlo.' :
        c === 'sin_api' ? 'Este navegador no deja pegar con un botón. Prueba con Ctrl+V (o Cmd+V).' :
        c === 'NotAllowedError' ? 'Para pegar, toca «Pegar» en el aviso que aparece.' : 'No se pudo pegar la imagen.');
}
function fotoPegadaEnFormulario(blob){
  S.hoja.fotoPegada = blob;
  var tf = $('#f-foto-txt'); if (tf) tf.textContent = 'Foto pegada';
  var inp = $('#f-foto'); if (inp) inp.value = '';
  toast('Foto pegada. Se guardará con el viaje.');
}
document.addEventListener('paste', function(e){
  var it = Array.prototype.filter.call((e.clipboardData && e.clipboardData.items) || [], function(x){ return x.kind === 'file' && /^image\//.test(x.type); })[0];
  if (!it || !assets) return;
  var blob = it.getAsFile(); if (!blob) return;
  if (S.hoja && (S.hoja.tipo === 'nuevo' || S.hoja.tipo === 'datos')) { e.preventDefault(); fotoPegadaEnFormulario(blob); }
  else if (!S.hoja && S.vista === 'viaje') { e.preventDefault(); subirFoto(blob); }
});
async function subirFoto(file, idViaje){
  if (!assets) return;
  var id = idViaje || S.viajeId;
  S.subiendo = true; if (!S.hoja && S.vista === 'viaje') render();
  try {
    var blob = await reducir(file);
    var r = await assets.upload(blob, {type: 'image/jpeg'});
    var v = viaje(id);
    if (v) {
      var anterior = v.fotoId;
      v = clone(v); v.fotoId = r.id; v.color = await colorDeFoto(blob); Sync.foto(r.id); guardar(v);
      if (anterior && anterior !== r.id) assets.delete(anterior).catch(function(){});
    }
  } catch (e) {
    var code = e && e.code;
    toast(code === 'too_large' ? 'La foto es demasiado grande.' : code === 'quota_or_state' ? 'No queda espacio para más fotos.' : 'No se pudo subir la foto. Prueba con otra.');
  }
  S.subiendo = false;
  if (!S.hoja) { if (S.vista === 'inicio') actualizarFondo(); else render(); }
}

render();
iniciar();
if ('serviceWorker' in navigator) {
  // Actualización automática: al volver a la app se busca una versión nueva y, cuando se instala, se recarga sola
  // (si hay una ventana abierta con algo a medio escribir, espera a que se cierre).
  var habiaVersion = !!navigator.serviceWorker.controller;
  var recargar = function(){ if (S.hoja) { S.recargarAlCerrar = true; return; } location.reload(); };
  navigator.serviceWorker.addEventListener('controllerchange', function(){ if (habiaVersion) recargar(); habiaVersion = true; });
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').then(function(reg){
      document.addEventListener('visibilitychange', function(){ if (!document.hidden) reg.update().catch(function(){}); });
      setInterval(function(){ if (!document.hidden) reg.update().catch(function(){}); }, 30 * 60 * 1000);
    }).catch(function(){});
  });

}
})();
