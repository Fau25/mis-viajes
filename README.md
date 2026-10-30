# Mis viajes

Organizador personal de viajes. Es una app web instalable (PWA) que funciona sin conexión.
Está publicada en GitHub Pages: https://fau25.github.io/mis-viajes/

## Piezas

| Archivo o carpeta | Qué es |
| --- | --- |
| `index.html` | La página y los estilos |
| `app.js` | Toda la lógica de la app |
| `sw.js` | Modo sin conexión. **Sube `VERSION` en cada cambio** |
| `fonts/` | Tipografías Instrument Sans e Instrument Serif (licencia OFL) |
| `img/` | Fotos del carrusel del inicio |
| `conserje/worker.js` | Conserje en Cloudflare (worker `mis-viajes-ia`): lee documentos con Claude y sincroniza |
| `pruebas/` | Pruebas automáticas; se pasan solas en cada publicación (pestaña Actions) |

## Conserje en Cloudflare

- Secretos: `ANTHROPIC_API_KEY` y `CLAVE_APP`. Nunca van en el código.
- Enlaces: `DB` (base de datos D1 `mis-viajes-db`, los viajes), `VIAJES` (almacén KV `mis-viajes-datos`, las fotos) y `LIMITE` (limitador de peticiones).
- Para actualizarlo: Cloudflare › Workers y Pages › mis-viajes-ia › Editar código › pegar `conserje/worker.js` › Desplegar.

## Pruebas en local

```
cd pruebas
npm install
npx playwright install chromium
node --no-warnings pruebas.js
```

Los datos de cada persona se guardan en su dispositivo (IndexedDB) y en su propio Cloudflare. Este repositorio no contiene datos ni claves.
