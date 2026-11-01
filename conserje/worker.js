// Conserje de "Mis viajes": recibe un PDF o una foto de una reserva,
// se lo pasa a Claude con la clave secreta y devuelve los datos ordenados.
// La clave de Claude (ANTHROPIC_API_KEY) y la contraseña de la app (CLAVE_APP)
// se guardan como secretos en Cloudflare, nunca en este código.

const ORIGENES_BASE = ['https://fau25.github.io'];
const MODELO_POR_DEFECTO = 'claude-haiku-5-5';
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_BASE64 = 14 * 1024 * 1024; // unos 10 MB de archivo

const TRAMO = {
  type: 'object',
  properties: {
    fecha: { type: 'string', description: 'Fecha de salida en formato AAAA-MM-DD' },
    hora: { type: 'string', description: 'Hora de salida HH:MM (24 h)' },
    origen: { type: 'string', description: 'Código corto del origen (IATA del aeropuerto o abreviatura de la estación), máx. 4 letras' },
    ciudadOrigen: { type: 'string' },
    destino: { type: 'string', description: 'Código corto del destino, máx. 4 letras' },
    ciudadDestino: { type: 'string' },
    numero: { type: 'string', description: 'Número de vuelo, tren o autobús' },
    asiento: { type: 'string' },
    compania: { type: 'string', description: 'Aerolínea o compañía' }
  }
};

const HERRAMIENTA = {
  name: 'guardar_reserva',
  description: 'Guarda los datos extraídos de una reserva de viaje.',
  input_schema: {
    type: 'object',
    properties: {
      clase: { type: 'string', enum: ['transporte', 'alojamiento', 'otro'], description: 'Qué tipo de reserva es' },
      viaje: {
        type: 'object',
        description: 'Datos generales que se deducen de la reserva',
        properties: {
          titulo: { type: 'string', description: 'Destino principal, corto (ej. "Japón", "Roma")' },
          subtitulo: { type: 'string', description: 'Ciudad o detalle (ej. "Tokio · Japón")' },
          inicio: { type: 'string', description: 'AAAA-MM-DD' },
          fin: { type: 'string', description: 'AAAA-MM-DD' }
        }
      },
      billetes: {
        type: 'array',
        description: 'Un elemento por cada billete o trayecto. Ida y vuelta directa = 1 billete con ida y vuelta. Con escalas o varios trayectos = 1 billete por tramo, solo con "ida".',
        items: {
          type: 'object',
          properties: {
            tipo: { type: 'string', enum: ['avion', 'tren', 'bus'] },
            ida: TRAMO,
            vuelta: TRAMO
          }
        }
      },
      alojamientos: {
        type: 'array',
        description: 'Un elemento por cada alojamiento reservado',
        items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          direccion: { type: 'string' },
          entrada: { type: 'string', description: 'Fecha de entrada AAAA-MM-DD' },
          salida: { type: 'string', description: 'Fecha de salida AAAA-MM-DD' },
          horaEntrada: { type: 'string', description: 'HH:MM' },
          horaSalida: { type: 'string', description: 'HH:MM' },
          codigo: { type: 'string', description: 'Código o número de reserva' },
          notas: { type: 'string', description: 'Datos útiles breves: régimen, habitación, teléfono…' }
        }
        }
      }
    },
    required: ['clase']
  }
};

const HERRAMIENTA_MALETA = {
  name: 'guardar_maleta',
  description: 'Guarda la lista de equipaje y las tareas antes de salir, adaptadas al viaje.',
  input_schema: {
    type: 'object',
    properties: {
      grupos: {
        type: 'array',
        description: 'Entre 5 y 9 grupos (ej. Documentos, Ropa, Aseo, Salud, Electrónica, Dinero, y otros propios del viaje)',
        items: {
          type: 'object',
          properties: {
            nombre: { type: 'string', description: 'Nombre corto del grupo' },
            items: { type: 'array', items: { type: 'string' }, description: 'Entre 2 y 10 artículos, nombres cortos (máx. 40 caracteres)' }
          },
          required: ['nombre', 'items']
        }
      },
      tareas: { type: 'array', items: { type: 'string' }, description: 'Entre 4 y 8 tareas para hacer antes de salir de casa' }
    },
    required: ['grupos', 'tareas']
  }
};

// Lista de maleta adaptada al viaje (solo texto, sin documento)
async function prepararMaleta(datos, env, cors) {
  const t = function (x, n) { return String(x == null ? '' : x).slice(0, n); };
  const v = datos.viaje || {};
  const lineas = [
    'Destino: ' + t(v.titulo, 80) + (v.subtitulo ? ' (' + t(v.subtitulo, 80) + ')' : ''),
    'Fechas: del ' + t(v.inicio, 10) + ' al ' + t(v.fin, 10) + ' (' + (Number(v.noches) || 0) + ' noches)',
    v.transporte ? 'Transporte: ' + t(v.transporte, 120) : '',
    Array.isArray(v.alojamientos) && v.alojamientos.length ? 'Alojamiento: ' + v.alojamientos.slice(0, 6).map(function (x) { return t(x, 60); }).join('; ') : '',
    Array.isArray(v.planes) && v.planes.length ? 'Planes del itinerario: ' + v.planes.slice(0, 40).map(function (x) { return t(x, 70); }).join('; ') : ''
  ].filter(Boolean).join('\n');
  const instrucciones =
    'Prepara la lista de maleta y las tareas antes de salir para este viaje, y guárdala con la herramienta guardar_maleta.\n' + lineas + '\n' +
    'Ten en cuenta el clima típico del destino en esas fechas, la duración, el transporte (por ejemplo, líquidos en cabina si es avión) y las actividades de los planes ' +
    '(por ejemplo, si es el Camino de Santiago: mochila, credencial, calzado ya usado, cuidado de pies). ' +
    'El primer grupo es Documentos. Artículos concretos y cortos, sin cantidades ni explicaciones, sin repetir. Escribe en español.';
  let r;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: env.MODELO || MODELO_POR_DEFECTO,
        max_tokens: 2000,
        tools: [HERRAMIENTA_MALETA],
        tool_choice: { type: 'tool', name: 'guardar_maleta' },
        messages: [{ role: 'user', content: instrucciones }]
      })
    });
  } catch (e) { return respuesta({ error: 'sin_conexion_ia' }, 502, cors); }
  if (!r.ok) {
    let detalle = '';
    try { const j = await r.json(); detalle = (j.error && j.error.message) || ''; } catch (e) {}
    return respuesta({ error: 'ia', estado: r.status, detalle: detalle.slice(0, 300) }, 502, cors);
  }
  const resultado = await r.json();
  const uso = (resultado.content || []).find(function (c) { return c.type === 'tool_use'; });
  if (!uso) return respuesta({ error: 'sin_datos' }, 422, cors);
  return respuesta({ ok: true, datos: uso.input || {} }, 200, cors);
}

const HERRAMIENTA_ITINERARIO = {
  name: 'guardar_itinerario',
  description: 'Guarda los planes del itinerario de viaje que aparecen en el documento.',
  input_schema: {
    type: 'object',
    properties: {
      planes: {
        type: 'array',
        description: 'Un elemento por cada plan, visita o actividad, en orden cronológico',
        items: {
          type: 'object',
          properties: {
            fecha: { type: 'string', description: 'Fecha del plan AAAA-MM-DD, si se puede saber' },
            dia: { type: 'integer', description: 'Número de día del viaje (1 = primer día), si el documento habla de "Día 1", "Día 2"…' },
            titulo: { type: 'string', description: 'Título corto del plan (ej. "Templo Senso-ji")' },
            descripcion: { type: 'string', description: 'Detalles breves: hora, dirección, entradas, consejos…' }
          },
          required: ['titulo']
        }
      }
    },
    required: ['planes']
  }
};

// ---------- Sincronización entre dispositivos (almacén KV llamado VIAJES) ----------
const ID_VALIDO = /^[A-Za-z0-9_-]{4,60}$/;
const MAX_FOTO = 12 * 1024 * 1024;
const DIAS_BORRADOS = 120;

async function sincronizar(request, env, cors) {
  let cuerpo;
  try { cuerpo = await request.json(); } catch (e) { return respuesta({ error: 'formato' }, 400, cors); }
  const estado = (await env.VIAJES.get('estado', 'json')) || { viajes: {}, borrados: {} };
  estado.viajes = estado.viajes || {}; estado.borrados = estado.borrados || {};
  let cambiado = false;
  const fotosQuitar = [];
  const cambios = Array.isArray(cuerpo.cambios) ? cuerpo.cambios : [];
  for (const v of cambios) {
    if (!v || !ID_VALIDO.test(String(v.id || ''))) continue;
    const id = v.id, nuevo = Number(v.actualizado) || 0;
    if ((estado.borrados[id] || 0) >= nuevo) continue;
    const actual = estado.viajes[id];
    if (!actual || nuevo > (Number(actual.actualizado) || 0)) {
      if (actual && actual.fotoId && actual.fotoId !== v.fotoId) fotosQuitar.push(actual.fotoId);
      estado.viajes[id] = v; cambiado = true;
    }
  }
  const borrados = cuerpo.borrados && typeof cuerpo.borrados === 'object' ? cuerpo.borrados : {};
  for (const id of Object.keys(borrados)) {
    if (!ID_VALIDO.test(id)) continue;
    const cuando = Number(borrados[id]) || 0;
    const actual = estado.viajes[id];
    if (actual && cuando >= (Number(actual.actualizado) || 0)) {
      if (actual.fotoId) fotosQuitar.push(actual.fotoId);
      delete estado.viajes[id]; cambiado = true;
    }
    if (cuando > (estado.borrados[id] || 0)) { estado.borrados[id] = cuando; cambiado = true; }
  }
  const limite = Date.now() - DIAS_BORRADOS * 864e5;
  for (const id of Object.keys(estado.borrados)) if (estado.borrados[id] < limite) { delete estado.borrados[id]; cambiado = true; }
  if (cambiado) await env.VIAJES.put('estado', JSON.stringify(estado));
  for (const f of fotosQuitar) if (ID_VALIDO.test(String(f))) { try { await env.VIAJES.delete('foto:' + f); } catch (e) {} }
  return respuesta({ ok: true, completo: true, viajes: Object.values(estado.viajes), borrados: estado.borrados }, 200, cors);
}

// Sincronización con base de datos D1 (DB): cada viaje es una fila y cada cambio se guarda
// al instante, así que dos dispositivos no pueden pisarse. Solo se acepta una versión si es más nueva.
let tablaLista = false;
async function prepararTabla(env) {
  if (tablaLista) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS viajes (id TEXT PRIMARY KEY, actualizado INTEGER NOT NULL, borrado INTEGER NOT NULL DEFAULT 0, datos TEXT, cambio INTEGER NOT NULL)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS viajes_cambio ON viajes (cambio)').run();
  tablaLista = true;
}
const GUARDAR_FILA =
  'INSERT INTO viajes (id, actualizado, borrado, datos, cambio) VALUES (?1, ?2, ?3, ?4, (SELECT COALESCE(MAX(cambio), 0) + 1 FROM viajes)) ' +
  'ON CONFLICT(id) DO UPDATE SET actualizado = excluded.actualizado, borrado = excluded.borrado, datos = excluded.datos, cambio = excluded.cambio ' +
  'WHERE excluded.actualizado > viajes.actualizado';

async function guardarFila(env, id, actualizado, borrado, datos) {
  const previa = await env.DB.prepare('SELECT datos FROM viajes WHERE id = ?1').bind(id).first();
  const r = await env.DB.prepare(GUARDAR_FILA).bind(id, actualizado, borrado ? 1 : 0, datos).run();
  if (!r.meta || !r.meta.changes || !previa || !previa.datos) return;
  // Si la foto del viaje cambió o el viaje se borró, se elimina la foto antigua
  let antes = null, ahora = null;
  try { antes = JSON.parse(previa.datos).fotoId; } catch (e) {}
  try { ahora = datos ? JSON.parse(datos).fotoId : null; } catch (e) {}
  if (antes && antes !== ahora && env.VIAJES && ID_VALIDO.test(String(antes))) { try { await env.VIAJES.delete('foto:' + antes); } catch (e) {} }
}

async function sincronizarD1(request, env, cors) {
  let cuerpo;
  try { cuerpo = await request.json(); } catch (e) { return respuesta({ error: 'formato' }, 400, cors); }
  await prepararTabla(env);
  const desde = Math.max(0, Number(cuerpo.desde) || 0);
  // Paso único: traer lo que hubiera en el almacén KV de la versión anterior
  if (desde === 0 && env.VIAJES && !(await env.DB.prepare('SELECT 1 AS hay FROM viajes LIMIT 1').first())) {
    const viejo = await env.VIAJES.get('estado', 'json');
    if (viejo) {
      for (const v of Object.values(viejo.viajes || {})) if (v && ID_VALIDO.test(String(v.id || ''))) await guardarFila(env, v.id, Number(v.actualizado) || 1, false, JSON.stringify(v));
      for (const [id, cuando] of Object.entries(viejo.borrados || {})) if (ID_VALIDO.test(id)) await guardarFila(env, id, Number(cuando) || 1, true, null);
    }
  }
  const cambios = Array.isArray(cuerpo.cambios) ? cuerpo.cambios : [];
  for (const v of cambios) {
    if (!v || !ID_VALIDO.test(String(v.id || ''))) continue;
    await guardarFila(env, v.id, Number(v.actualizado) || 0, false, JSON.stringify(v));
  }
  const borrados = cuerpo.borrados && typeof cuerpo.borrados === 'object' ? cuerpo.borrados : {};
  for (const id of Object.keys(borrados)) {
    if (!ID_VALIDO.test(id)) continue;
    await guardarFila(env, id, Number(borrados[id]) || 0, true, null);
  }
  const filas = (await env.DB.prepare('SELECT id, actualizado, borrado, datos, cambio FROM viajes WHERE cambio > ?1 ORDER BY cambio').bind(desde).all()).results || [];
  const viajes = [], idsBorrados = {};
  let hasta = desde;
  for (const f of filas) {
    hasta = Math.max(hasta, f.cambio);
    if (f.borrado) { idsBorrados[f.id] = f.actualizado; continue; }
    try { viajes.push(JSON.parse(f.datos)); } catch (e) {}
  }
  return respuesta({ ok: true, completo: desde === 0, hasta, viajes, borrados: idsBorrados }, 200, cors);
}

async function foto(request, env, cors, id) {
  if (!ID_VALIDO.test(id)) return respuesta({ error: 'formato' }, 400, cors);
  if (request.method === 'PUT') {
    const datos = await request.arrayBuffer();
    if (!datos.byteLength) return respuesta({ error: 'formato' }, 400, cors);
    if (datos.byteLength > MAX_FOTO) return respuesta({ error: 'demasiado_grande' }, 413, cors);
    const tipoFoto = String(request.headers.get('Content-Type') || 'image/jpeg').split(';')[0].trim();
    if (!TIPOS_IMAGEN.includes(tipoFoto)) return respuesta({ error: 'tipo_no_valido' }, 415, cors);
    await env.VIAJES.put('foto:' + id, datos, { metadata: { tipo: tipoFoto } });
    return respuesta({ ok: true }, 200, cors);
  }
  if (request.method === 'GET') {
    const r = await env.VIAJES.getWithMetadata('foto:' + id, 'arrayBuffer');
    if (!r || !r.value) return respuesta({ error: 'no_existe' }, 404, cors);
    return new Response(r.value, { status: 200, headers: { ...cors, 'Content-Type': (r.metadata && r.metadata.tipo) || 'image/jpeg', 'Cache-Control': 'no-store' } });
  }
  return respuesta({ error: 'metodo' }, 405, cors);
}

// Comparación en tiempo constante: no deja adivinar la contraseña midiendo cuánto tarda la respuesta
function mismaClave(a, b) {
  a = String(a || ''); b = String(b || '');
  let dif = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) dif |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return dif === 0 && b.length > 0;
}

function respuesta(cuerpo, estado, cors) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export default {
  async fetch(request, env) {
    const origen = request.headers.get('Origin') || '';
    // Direcciones extra permitidas (por ejemplo, una dirección propia en Cloudflare Pages) en la variable ORIGENES, separadas por comas
    const ORIGENES_PERMITIDOS = ORIGENES_BASE.concat(String(env.ORIGENES || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean));
    const cors = {
      'Access-Control-Allow-Origin': ORIGENES_PERMITIDOS.includes(origen) ? origen : ORIGENES_PERMITIDOS[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Clave-App',
      'Vary': 'Origin'
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const ruta = new URL(request.url).pathname.replace(/\/+$/, '');
    if (ruta === '' && request.method !== 'POST') return respuesta({ ok: true, mensaje: 'El conserje de Mis viajes está funcionando.', almacen: !!env.VIAJES, baseDeDatos: !!env.DB, limite: !!env.LIMITE }, 200, cors);

    // Límite de peticiones por dirección IP (enlace "Rate limiter" llamado LIMITE): frena a quien pruebe contraseñas sin parar
    if (env.LIMITE) {
      const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
      try {
        const { success } = await env.LIMITE.limit({ key: ip });
        if (!success) return respuesta({ error: 'demasiadas_peticiones' }, 429, cors);
      } catch (e) {}
    }
    if (!env.CLAVE_APP || !mismaClave(request.headers.get('X-Clave-App'), env.CLAVE_APP)) {
      return respuesta({ error: 'clave_app' }, 401, cors);
    }

    // Sincronización
    if (ruta === '/sync' || ruta.indexOf('/foto/') === 0) {
      if (!env.VIAJES) return respuesta({ error: 'sin_almacen' }, 503, cors);
      try {
        if (ruta === '/sync') {
          if (request.method !== 'POST') return respuesta({ error: 'metodo' }, 405, cors);
          return env.DB ? await sincronizarD1(request, env, cors) : await sincronizar(request, env, cors);
        }
        return await foto(request, env, cors, decodeURIComponent(ruta.slice(6)));
      } catch (e) {
        return respuesta({ error: 'almacen' }, 500, cors);
      }
    }
    if (request.method !== 'POST') return respuesta({ error: 'metodo' }, 405, cors);

    // Lectura de documentos con IA
    if (!env.ANTHROPIC_API_KEY) return respuesta({ error: 'falta_clave_ia' }, 500, cors);

    let datos;
    try { datos = await request.json(); } catch (e) { return respuesta({ error: 'formato' }, 400, cors); }
    if (datos && datos.modo === 'maleta') return await prepararMaleta(datos, env, cors);
    const archivo = datos && datos.archivo;
    const tipo = datos && datos.tipo;
    if (!archivo || !tipo) return respuesta({ error: 'formato' }, 400, cors);
    if (archivo.length > MAX_BASE64) return respuesta({ error: 'demasiado_grande' }, 413, cors);

    let bloque;
    if (tipo === 'application/pdf') {
      bloque = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: archivo } };
    } else if (TIPOS_IMAGEN.includes(tipo)) {
      bloque = { type: 'image', source: { type: 'base64', media_type: tipo, data: archivo } };
    } else {
      return respuesta({ error: 'tipo_no_valido' }, 415, cors);
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const esItinerario = datos.modo === 'itinerario';
    const limpiarFecha = function (x) { return /^\d{4}-\d{2}-\d{2}$/.test(String(x || '')) ? String(x) : ''; };
    const instruccionesItinerario =
      'Lee este documento y extrae el itinerario de viaje: cada plan, visita o actividad, y guárdalo con la herramienta guardar_itinerario. ' +
      (limpiarFecha(datos.inicio) ? 'El viaje va del ' + limpiarFecha(datos.inicio) + ' al ' + limpiarFecha(datos.fin) + '. ' : '') +
      (datos.destino ? 'Destino: ' + String(datos.destino).slice(0, 80) + '. ' : '') +
      'Para cada plan indica la fecha (AAAA-MM-DD) si se deduce, o el número de día si el documento usa "Día 1", "Día 2"… ' +
      'Un plan por cada actividad o visita, con un título corto y una descripción breve (hora, lugar, consejos). ' +
      'No incluyas vuelos ni hoteles como planes. No inventes datos. Escribe en español salvo nombres propios.';
    const instrucciones =
      'Lee esta reserva de viaje (billete de avión, tren o autobús, o reserva de alojamiento) y guarda sus datos con la herramienta guardar_reserva. ' +
      'Usa fechas AAAA-MM-DD y horas HH:MM en 24 h. Si falta el año, deduce el más próximo a partir de hoy (' + hoy + '). ' +
      'Puede haber varios billetes en el mismo documento: crea un elemento en "billetes" por cada uno. ' +
      'Si es un viaje de ida y vuelta directo (sin escalas), usa un solo billete con "ida" y "vuelta". ' +
      'Si hay escalas o trayectos encadenados, crea un billete por cada tramo, rellenando solo "ida" y dejando "vuelta" vacía. ' +
      'Si el billete es de solo ida, deja "vuelta" vacía. Rellena solo lo que aparezca en el documento; no inventes datos. ' +
      'Escribe los textos en español salvo nombres propios.';

    let r;
    try {
      r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: env.MODELO || MODELO_POR_DEFECTO,
          max_tokens: esItinerario ? 8000 : 4000,
          tools: [esItinerario ? HERRAMIENTA_ITINERARIO : HERRAMIENTA],
          tool_choice: { type: 'tool', name: esItinerario ? 'guardar_itinerario' : 'guardar_reserva' },
          messages: [{ role: 'user', content: [bloque, { type: 'text', text: esItinerario ? instruccionesItinerario : instrucciones }] }]
        })
      });
    } catch (e) {
      return respuesta({ error: 'sin_conexion_ia' }, 502, cors);
    }

    if (!r.ok) {
      let detalle = '';
      try { const j = await r.json(); detalle = (j.error && j.error.message) || ''; } catch (e) {}
      return respuesta({ error: 'ia', estado: r.status, detalle: detalle.slice(0, 300) }, 502, cors);
    }

    const resultado = await r.json();
    const uso = (resultado.content || []).find(function (c) { return c.type === 'tool_use'; });
    if (!uso) return respuesta({ error: 'sin_datos' }, 422, cors);
    const leido = uso.input || {};
    if (esItinerario) return respuesta({ ok: true, datos: { planes: Array.isArray(leido.planes) ? leido.planes : [] } }, 200, cors);
    // Compatibilidad con versiones anteriores de la app
    if (Array.isArray(leido.billetes) && leido.billetes.length) leido.transporte = leido.billetes[0];
    if (Array.isArray(leido.alojamientos) && leido.alojamientos.length) leido.alojamiento = leido.alojamientos[0];
    return respuesta({ ok: true, datos: leido }, 200, cors);
  }
};
