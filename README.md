# Bicicletas GDL

Visualización geoespacial de los viajes registrados por el sistema MiBici durante junio de 2026. La aplicación reproduce sobre un mapa oscuro las trayectorias inferidas de cada día, conserva la orientación del desplazamiento y permite explorar la actividad a escala de calle.

## Descripción

El proyecto transforma los registros abiertos de MiBici en una simulación cartográfica interactiva. Cada viaje se representa como una bicicleta formada por cuatro chevrones, orientada según la dirección instantánea del recorrido y coloreada de acuerdo con el género registrado.

La interfaz carga un día completo y reproduce sus 24 horas sobre una línea de tiempo continua. El panel de control flota sobre el mapa, puede ocultarse y concentra la selección de fecha, velocidad, zoom y filtros demográficos.

## Funcionalidades

- Selección de cualquiera de los 30 días de junio de 2026.
- Reproducción continua de las 24 horas del día seleccionado.
- Velocidades de simulación de `1×`, `60×`, `300×` y `1800×`.
- Navegación del mapa mediante desplazamiento y zoom entre los niveles 12 y 19.
- Representación direccional de bicicletas sin dibujar líneas de ruta.
- Codificación por género: mujer, hombre y registro sin dato.
- Filtros por género y rango de año de nacimiento.
- Panel de controles flotante, adaptable y plegable.
- Carga bajo demanda de los archivos horarios correspondientes al día seleccionado.

## Cobertura de los datos

| Métrica | Valor |
| --- | ---: |
| Periodo | Junio de 2026 |
| Días disponibles | 30 |
| Viajes en el archivo fuente | 355,303 |
| Viajes con coordenadas | 323,648 |
| Viajes sin coordenadas | 31,655 |
| Pares origen-destino resueltos | 43,706 |
| Archivos horarios procesados | 619 |

Los viajes sin coordenadas se conservan en el resumen estadístico, pero no forman parte de la animación.

## Metodología de las trayectorias

Los datos originales contienen la estación de origen y la estación de destino, no el recorrido GPS. La geometría intermedia se infiere sobre la red vial y se reutiliza para los viajes que comparten el mismo par origen-destino.

La posición de cada bicicleta se obtiene interpolando su avance sobre esa geometría de acuerdo con la hora de inicio y la duración registrada. La orientación se calcula a partir del segmento recorrido en cada instante. Las trayectorias son aproximaciones visuales y no representan el itinerario real seguido por cada usuario.

## Tecnologías

- React 19
- Vite 8
- Canvas 2D
- Proyección Web Mercator
- Teselas oscuras de CARTO basadas en OpenStreetMap
- Cloudflare Workers Static Assets

## Arquitectura

```text
src/
├── App.jsx                  Estado, carga diaria, filtros y reloj de animación
├── components/
│   └── Sidebar.jsx          Panel flotante y controles
├── data/
│   └── manifest.js          Resumen, estaciones y disponibilidad mensual
├── map/
│   ├── MapSurface.jsx       Teselas, interacción y renderizado en Canvas
│   └── mercator.js          Proyección e interpolación de trayectorias
└── styles.css               Tema oscuro y diseño adaptable

public/data/hours/           Datos horarios cargados bajo demanda
wrangler.jsonc               Configuración de despliegue en Cloudflare
```

El mapa base y la animación comparten la misma proyección y transformación de cámara. Los datos del día seleccionado se descargan en archivos horarios y se preparan en memoria antes del renderizado.

## Requisitos

- Node.js 22
- npm
- Conexión a internet para cargar las teselas de CARTO

## Instalación y desarrollo

```bash
git clone git@github.com:Betancourt1/mibici_junio_2026.git
cd mibici_junio_2026
npm ci
npm run dev
```

El servidor de desarrollo queda disponible en <http://localhost:5173> y escucha en todas las interfaces de red.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo de Vite. |
| `npm run build` | Genera el paquete de producción en `dist/`. |
| `npm run preview` | Sirve localmente el paquete de producción. |
| `npm run deploy` | Compila y despliega los recursos estáticos con Wrangler. |

## Compilación de producción

```bash
npm run build
npm run preview
```

La vista previa queda disponible en <http://localhost:4173>.

## Despliegue en Cloudflare

El archivo `wrangler.jsonc` configura `dist/` como un conjunto de recursos estáticos y aplica el fallback de aplicación de página única.

```bash
npx wrangler login
npm run deploy
```

Wrangler publica el proyecto como `bicis-gdl` y devuelve una URL bajo `workers.dev`. Los dominios personalizados se administran en **Cloudflare Dashboard → Workers & Pages → bicis-gdl → Settings → Domains & Routes**.

Documentación técnica relacionada:

- [React y Vite en Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/)
- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Enrutamiento de aplicaciones SPA](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)

## Controles

| Entrada | Acción |
| --- | --- |
| `Espacio` | Reproduce o pausa la simulación. |
| `←` / `→` | Retrocede o adelanta 30 segundos. |
| Rueda del ratón | Modifica el nivel de zoom. |
| Arrastre | Desplaza la vista del mapa. |
| Botón del encabezado | Oculta o muestra el panel flotante. |
| `1×`, `60×`, `300×`, `1800×` | Modifica la velocidad de reproducción. |

## Limitaciones

- Las rutas son geometrías inferidas, no trazas GPS.
- La animación excluye los viajes que no tienen coordenadas de origen o destino.
- La disponibilidad del mapa base depende del servicio externo de teselas.
- Los valores de género reproducen la clasificación presente en el conjunto de datos original.

## Fuente y atribución

- Datos de viajes y estaciones: [Datos abiertos de MiBici](https://mibici.net/es/datos-abiertos/).
- Mapa base: © OpenStreetMap © CARTO.
