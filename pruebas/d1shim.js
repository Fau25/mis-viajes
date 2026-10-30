// Imitación mínima de Cloudflare D1 y KV sobre SQLite real (node:sqlite) para pruebas
const { DatabaseSync } = require('node:sqlite');
function crearD1(){
  const db = new DatabaseSync(':memory:');
  const prep = (sql) => { let args = []; const o = {
    bind(...a){ args = a; return o; },
    async first(){ const r = db.prepare(sql).get(...args); return r ? {...r} : null; },
    async run(){ const r = db.prepare(sql).run(...args); return {meta: {changes: Number(r.changes)}}; },
    async all(){ return {results: db.prepare(sql).all(...args).map(r=>({...r}))}; } }; return o; };
  return { prepare: prep, _db: db };
}
function crearKV(){ const mem = new Map(); return { mem,
  async get(k,t){ const v=mem.get(k); return v==null?null:(t==='json'?JSON.parse(v.v):v.v); },
  async getWithMetadata(k){ const v=mem.get(k); return v?{value:v.v,metadata:v.m}:{value:null}; },
  async put(k,v,o){ mem.set(k,{v,m:o&&o.metadata}); }, async delete(k){ mem.delete(k); } }; }
module.exports = { crearD1, crearKV };
