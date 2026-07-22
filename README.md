# Bicicletas GDL

Aplicación React que anima los viajes de MiBici registrados durante todo junio de 2026. El selector permite elegir cualquiera de los 30 días y la línea de tiempo recorre directamente sus 24 horas. El mapa usa un fondo oscuro de CARTO y mantiene las estaciones y bicicletas en la misma proyección Web Mercator.

Las líneas de ruta no se dibujan. Cada bicicleta se representa con cuatro chevrones orientados según el segmento que está recorriendo y se colorea por género.

## Requisitos

- Node.js 22 recomendado.
- npm.
- Conexión a internet para cargar las teselas del mapa de CARTO.

Los datos procesados ya están incluidos en `public/data/hours/`; no se necesitan los CSV originales para ejecutar o desplegar la aplicación. La interfaz descarga sólo los archivos horarios del día seleccionado, no los 323,648 viajes al abrir la página.

## Verlo en local

```bash
cd /home/betancourt/GitHub/bicis
npm install
npm run dev
```

Abre <http://localhost:5173>.

Vite escucha en todas las interfaces para que también puedas abrirlo desde otro equipo de la misma red usando la IP de esta computadora.

## Probar el build de producción

```bash
npm run build
npm run preview
```

Abre <http://localhost:4173>. El resultado compilado queda en `dist/`.

## Desplegar en Cloudflare

El proyecto está preparado para **Cloudflare Workers Static Assets** mediante `wrangler.jsonc`. Cloudflare sirve el contenido de `dist/` y aplica el fallback de SPA a `index.html`.

1. Inicia sesión en Cloudflare desde la terminal:

   ```bash
   npx wrangler login
   ```

2. Si quieres otro nombre público, cambia `name` en `wrangler.jsonc`.

3. Compila y despliega:

   ```bash
   npm run deploy
   ```

Wrangler mostrará la URL `*.workers.dev` al terminar. Los despliegues siguientes se hacen con el mismo comando.

Para asociar un dominio propio, entra en **Cloudflare Dashboard → Workers & Pages → bicis-gdl → Settings → Domains & Routes** y agrega el dominio o subdominio.

Documentación oficial:

- [React + Vite en Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/)
- [Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Configuración de una SPA](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)

## Controles

- `Espacio`: reproducir o pausar.
- Botón del encabezado: ocultar o mostrar el menú flotante.
- `←` y `→`: retroceder o adelantar 30 segundos.
- Rueda del ratón: cambiar el zoom.
- Arrastrar el mapa: mover la vista.
- Botones `1×`, `60×`, `300×` y `1800×`: cambiar la velocidad.

## Estructura

```text
src/
├── App.jsx                 Estado, filtros y reloj de animación
├── components/Sidebar.jsx Controles fuera del mapa
├── data/manifest.js       Resumen, estaciones y horas disponibles del mes
├── map/MapSurface.jsx     Teselas y Canvas de estaciones/bicicletas
├── map/mercator.js        Proyección e interpolación de trayectorias
└── styles.css             Tema oscuro y diseño adaptable
public/data/hours/          619 archivos JSON cargados bajo demanda
```

## Fuentes y método

- Los campos de viaje y estación provienen de los datos abiertos oficiales de MiBici de junio de 2026.
- El CSV contiene 355,303 viajes; 323,648 tienen coordenadas en origen y destino y aparecen en la simulación. Los otros 31,655 se conservan en el resumen, pero no se inventa su posición.
- Las 43,706 combinaciones origen-destino se resolvieron sobre la red vial y se reutilizan entre viajes.
- La geometría intermedia es inferida sobre la capa vial de CARTO/OpenStreetMap; no representa el GPS real de cada viaje.
- Mapa © OpenStreetMap © CARTO.
