import { useEffect, useState } from 'react'
import { Circle, NavigationArrow } from '@phosphor-icons/react'
import { COLORS, GENDERS, PLAYBACK_SECONDS } from '../config.js'

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const RIDER_SYMBOLS = [
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

function ThemeIcon({ theme }) {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    {theme === 'dark'
      ? <>
        <circle cx="10" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4m8.6 8.6 1.4 1.4m0-11.4-1.4 1.4m-8.6 8.6-1.4 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
      : <path d="M15.8 12.6A6.8 6.8 0 0 1 7.4 4.2a6.8 6.8 0 1 0 8.4 8.4Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
}

function PlayIcon({ playing }) {
  return <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    {playing
      ? <path d="M7 4v12M13 4v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      : <path d="m6 4 10 6-10 6V4Z" fill="currentColor" />}
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
  const labels = { F: 'Mujer', M: 'Hombre' }
  return <button className="gender-button" type="button" aria-pressed={active} onClick={onClick}>
    <span className="swatch" style={{ '--swatch': COLORS[code] }} />
    {labels[code]}
  </button>
}

function TravelDistribution({ bins, currentTime, activeCount }) {
  const max = Math.max(1, ...bins)
  const barWidth = 100 / bins.length
  const currentBin = Math.min(bins.length - 1, Math.floor(currentTime / PLAYBACK_SECONDS * bins.length))
  const currentX = currentTime / PLAYBACK_SECONDS * 100

  return <div className="travel-distribution">
    <div className="distribution-label">
      <span>Viajes activos durante el día</span>
      <strong>{activeCount.toLocaleString('es-MX')} ahora</strong>
    </div>
    <svg
      viewBox="0 0 100 34"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Distribución de viajes activos en intervalos de 15 minutos. Máximo ${max.toLocaleString('es-MX')}; ${activeCount.toLocaleString('es-MX')} en la hora actual.`}
    >
      {bins.map((count, index) => {
        const height = Math.max(1, count / max * 30)
        return <rect
          key={index}
          className={index === currentBin ? 'activity-bar activity-bar-current' : 'activity-bar'}
          x={index * barWidth}
          y={34 - height}
          width={Math.max(0.45, barWidth * 0.72)}
          height={height}
        />
      })}
      <line className="current-time-marker" x1={currentX} x2={currentX} y1="0" y2="34" />
    </svg>
  </div>
}

export default function Sidebar({
  summary,
  days,
  selectedDate,
  onDateChange,
  genders,
  setGenders,
  filteredCount,
  activeCount,
  activityBins,
  currentTime,
  setCurrentTime,
  playing,
  setPlaying,
  speed,
  setSpeed,
  riderSymbol,
  setRiderSymbol,
  theme,
  setTheme,
  loading,
}) {
  const [collapsed, setCollapsed] = useState(
    () => globalThis.matchMedia?.('(max-width: 760px)').matches ?? false,
  )
  function toggleGender(code) {
    setGenders((current) => current.includes(code)
      ? current.filter((value) => value !== code)
      : GENDERS.filter((value) => current.includes(value) || value === code))
  }

  useEffect(() => {
    const phoneViewport = globalThis.matchMedia?.('(max-width: 760px)')
    if (!phoneViewport) return undefined
    const adaptPanel = (event) => setCollapsed(event.matches)
    phoneViewport.addEventListener('change', adaptPanel)
    return () => phoneViewport.removeEventListener('change', adaptPanel)
  }, [])

  return <aside className="sidebar" data-collapsed={collapsed} aria-label="Controles de la simulación">
    <header className="brand">
      <BikeIcon />
      <h1>Bicicletas GDL</h1>
      <button
        className="theme-toggle"
        type="button"
        aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro'}
        title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
        onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
      >
        <ThemeIcon theme={theme} />
      </button>
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
      <TravelDistribution bins={activityBins} currentTime={currentTime} activeCount={activeCount} />
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
        {RIDER_SYMBOLS.map((symbol) => {
          const SymbolIcon = symbol.value === 'arrow' ? NavigationArrow : Circle
          return <button
            key={symbol.value}
            className="symbol-button"
            type="button"
            aria-pressed={riderSymbol === symbol.value}
            title={symbol.description}
            onClick={() => setRiderSymbol(symbol.value)}
          >
            <SymbolIcon className="symbol-preview" size={19} weight={symbol.value === 'arrow' ? 'fill' : 'bold'} aria-hidden="true" />
            <span>{symbol.label}</span>
          </button>
        })}
      </div>
    </section>

    <section className="sidebar-section" aria-labelledby="filters-title">
      <h2 id="filters-title">Filtros del día</h2>
      <div className="gender-title">Género</div>
      <div className="gender-grid">
        {GENDERS.map((code) => <GenderButton key={code} code={code} active={genders.includes(code)} onClick={() => toggleGender(code)} />)}
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
