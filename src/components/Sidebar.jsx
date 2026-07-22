import { useState } from 'react'
import { COLORS, GENDERS, MAX_ZOOM, MIN_ZOOM, PLAYBACK_SECONDS } from '../config.js'

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const RIDER_SYMBOLS = [
  { value: 'chevrons', label: 'Chevrones', description: 'Dirección y movimiento' },
  { value: 'arrow', label: 'Flecha', description: 'Dirección con menos ruido' },
  { value: 'dot', label: 'Punto', description: 'Densidad y volumen' },
]

function BikeIcon() {
  return <svg width="44" height="32" viewBox="0 0 48 34" fill="none" aria-hidden="true">
    <circle cx="10" cy="24" r="7.5" stroke="currentColor" strokeWidth="2" />
    <circle cx="38" cy="24" r="7.5" stroke="currentColor" strokeWidth="2" />
    <path d="M10 24 18 10l8 14H10Zm8-14h8m0 0 12 14m-12-14 4-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

function PanelToggleIcon({ collapsed }) {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2.5" y="3" width="15" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 3v14" stroke="currentColor" strokeWidth="1.5" />
    <path d={collapsed ? 'm10 7 3 3-3 3' : 'm13 7-3 3 3 3'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

function PlayIcon({ playing }) {
  return <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    {playing
      ? <path d="M7 4v12M13 4v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      : <path d="m6 4 10 6-10 6V4Z" fill="currentColor" />}
  </svg>
}

function ZoomIcon({ plus }) {
  return <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d={plus ? 'M4 10h12M10 4v12' : 'M4 10h12'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
}

function TargetIcon() {
  return <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="10" cy="10" r="2" fill="currentColor" />
    <path d="M10 1v3M10 16v3M1 10h3M16 10h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
}

function ResetIcon() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M4 6h12M8 3h4m-7 3 1 11h8l1-11M8 9v5m4-5v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

function RouteIcon() {
  return <svg width="27" height="27" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M3 24c5-11 9 4 14-7 3-7 7-5 12-10" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 3" strokeLinecap="round" />
    <path d="m24 5 5 2-2 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="4" cy="24" r="2" fill="currentColor" />
  </svg>
}

function DatabaseIcon() {
  return <svg width="25" height="25" viewBox="0 0 30 30" fill="none" aria-hidden="true">
    <ellipse cx="15" cy="6" rx="10" ry="4" stroke="currentColor" strokeWidth="1.7" />
    <path d="M5 6v9c0 2.2 4.5 4 10 4s10-1.8 10-4V6M5 15v8c0 2.2 4.5 4 10 4s10-1.8 10-4v-8" stroke="currentColor" strokeWidth="1.7" />
  </svg>
}

function dateParts(date) {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

function formatPeriod(date) {
  const { year, month, day } = dateParts(date)
  return `${day} ${MONTHS[month - 1]} ${year} · día completo`
}

function formatDateOption(dayData) {
  const { month, day } = dateParts(dayData.date)
  const count = dayData.hours.reduce((total, hour) => total + hour.count, 0)
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} · ${count.toLocaleString('es-MX')} viajes`
}

function formatClock(seconds) {
  const total = Math.round(seconds)
  const values = [Math.floor(total / 3600), Math.floor(total % 3600 / 60), total % 60]
  return values.map((value) => String(value).padStart(2, '0')).join(':')
}

function GenderButton({ code, active, onClick }) {
  const labels = { F: 'Mujer', M: 'Hombre', NULL: 'Sin dato' }
  return <button className="gender-button" type="button" aria-pressed={active} onClick={onClick}>
    <span className="swatch" style={{ '--swatch': COLORS[code] }} />
    {labels[code]}
  </button>
}

export default function Sidebar({
  summary,
  days,
  selectedDate,
  onDateChange,
  filters,
  setFilters,
  genders,
  setGenders,
  filteredCount,
  activeCount,
  currentTime,
  setCurrentTime,
  playing,
  setPlaying,
  speed,
  setSpeed,
  riderSymbol,
  setRiderSymbol,
  zoom,
  setZoom,
  onCenter,
  onReset,
  loading,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const allGenders = genders.length === GENDERS.length
  const updateFilter = (field) => (event) => {
    setFilters((current) => ({ ...current, [field]: event.target.value }))
  }

  function toggleGender(code) {
    setGenders((current) => current.includes(code)
      ? current.filter((value) => value !== code)
      : GENDERS.filter((value) => current.includes(value) || value === code))
  }

  return <aside className="sidebar" data-collapsed={collapsed} aria-label="Controles de la simulación">
    <header className="brand">
      <BikeIcon />
      <h1>Bicicletas GDL</h1>
      <button
        className="panel-toggle"
        type="button"
        aria-label={collapsed ? 'Mostrar menú' : 'Ocultar menú'}
        aria-controls="sidebar-content"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((value) => !value)}
      >
        <PanelToggleIcon collapsed={collapsed} />
      </button>
    </header>

    <div id="sidebar-content" hidden={collapsed}>
    <div className="month-summary">
      <strong>{summary.mappedTrips.toLocaleString('es-MX')}</strong>
      <span>viajes con coordenadas · junio 2026 completo</span>
    </div>

    <div className="date-selection">
      <label>Día
        <select className="select" value={selectedDate} onChange={(event) => onDateChange(event.target.value)}>
          {days.map((day) => <option key={day.date} value={day.date}>{formatDateOption(day)}</option>)}
        </select>
      </label>
    </div>

    <p className="period">{formatPeriod(selectedDate)}</p>
    <div className="trip-count">
      <strong>{loading ? '—' : filteredCount.toLocaleString('es-MX')}</strong>
      <span>viajes en este día</span>
    </div>

    <div className="clock">{formatClock(currentTime)}</div>
    <div className="active-count" aria-live="polite">{activeCount.toLocaleString('es-MX')} bicicletas activas</div>
    <button className="play-button" type="button" disabled={loading || !filteredCount} onClick={() => setPlaying((current) => !current)}>
      <PlayIcon playing={playing} /> {playing ? 'Pausar' : 'Reproducir'}
    </button>

    <div className="speed-grid" aria-label="Velocidad de reproducción">
      {[1, 60, 300, 1800].map((value) => <button
        key={value}
        className="control-button"
        type="button"
        aria-pressed={speed === value}
        onClick={() => setSpeed(value)}
      >{value}×</button>)}
    </div>

    <div className="timeline">
      <div className="time-labels">
        <span>00:00:00</span>
        <span>24:00:00</span>
      </div>
      <input
        className="range"
        type="range"
        min="0"
        max={PLAYBACK_SECONDS}
        step="60"
        value={Math.round(currentTime)}
        disabled={loading}
        aria-label="Hora del día"
        onChange={(event) => setCurrentTime(Number(event.target.value))}
      />
    </div>

    <section className="sidebar-section" aria-labelledby="rider-symbol-title">
      <span id="rider-symbol-title" className="section-label">Símbolo de ciclista</span>
      <div className="symbol-grid">
        {RIDER_SYMBOLS.map((symbol) => <button
          key={symbol.value}
          className="symbol-button"
          type="button"
          aria-pressed={riderSymbol === symbol.value}
          title={symbol.description}
          onClick={() => setRiderSymbol(symbol.value)}
        >
          <span className={`symbol-preview symbol-preview-${symbol.value}`} aria-hidden="true" />
          <span>{symbol.label}</span>
        </button>)}
      </div>
    </section>

    <section className="sidebar-section" aria-labelledby="map-controls-title">
      <span id="map-controls-title" className="section-label">Zoom del mapa · nivel {zoom}</span>
      <div className="zoom-grid">
        <button className="control-button" type="button" aria-label="Alejar mapa" onClick={() => setZoom((current) => Math.max(MIN_ZOOM, current - 1))}><ZoomIcon plus={false} /></button>
        <button className="control-button" type="button" aria-label="Acercar mapa" onClick={() => setZoom((current) => Math.min(MAX_ZOOM, current + 1))}><ZoomIcon plus /></button>
        <button className="control-button center-button" type="button" onClick={onCenter}><TargetIcon /> Centrar</button>
      </div>
    </section>

    <section className="sidebar-section" aria-labelledby="filters-title">
      <h2 id="filters-title">Filtros del día</h2>
      <div className="gender-title">Género</div>
      <div className="gender-grid">
        <button className="gender-button" type="button" aria-pressed={allGenders} onClick={() => setGenders(allGenders ? [] : [...GENDERS])}>
          <span className="swatch-all" aria-hidden="true">
            <i style={{ '--swatch': COLORS.F }} />
            <i style={{ '--swatch': COLORS.M }} />
            <i style={{ '--swatch': COLORS.NULL }} />
          </span>
          Todos
        </button>
        {GENDERS.map((code) => <GenderButton key={code} code={code} active={genders.includes(code)} onClick={() => toggleGender(code)} />)}
      </div>

      <div className="year-grid">
        <label>Nacimiento desde<input className="input" type="number" value={filters.birthFrom} onChange={updateFilter('birthFrom')} placeholder="Ej. 1980" /></label>
        <label>hasta<input className="input" type="number" value={filters.birthTo} onChange={updateFilter('birthTo')} placeholder="Ej. 2005" /></label>
      </div>

      <div className="actions">
        <button className="action-button" type="button" onClick={onReset}><ResetIcon /> Limpiar filtros</button>
        <button className="action-button action-primary" type="button" onClick={onCenter}><TargetIcon /> Centrar Guadalajara</button>
      </div>
    </section>

    <footer className="source">
      <div className="source-line"><RouteIcon /><span>{summary.streetRoutedPairs.toLocaleString('es-MX')} pares sobre red vial</span></div>
      <div className="source-line"><DatabaseIcon /><span>MiBici · junio 2026 · {summary.unmappedTrips.toLocaleString('es-MX')} viajes sin coordenadas</span></div>
      <small>Los campos provienen del CSV oficial. La geometría intermedia es inferida y los archivos horarios del día se cargan bajo demanda.</small>
    </footer>
    </div>
  </aside>
}
