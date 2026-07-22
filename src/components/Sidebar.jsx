import { useEffect, useState } from 'react'
import { CaretDown, CaretUp, Circle, NavigationArrow } from '@phosphor-icons/react'
import { COLORS, GENDERS } from '../config.js'

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

function dateParts(date) {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

function formatDateOption(dayData) {
  const { month, day } = dateParts(dayData.date)
  const count = dayData.hours.reduce((total, hour) => total + hour.count, 0)
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} · ${count.toLocaleString('es-MX')} viajes`
}

function GenderButton({ code, active, onClick }) {
  const labels = { F: 'Mujer', M: 'Hombre' }
  return <button className="gender-button" type="button" aria-pressed={active} onClick={onClick}>
    <span className="swatch" style={{ '--swatch': COLORS[code] }} />
    {labels[code]}
  </button>
}

export default function Sidebar({
  days,
  selectedDate,
  onDateChange,
  genders,
  setGenders,
  filteredCount,
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
  const [phoneLayout, setPhoneLayout] = useState(
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
    const adaptPanel = (event) => {
      setPhoneLayout(event.matches)
      setCollapsed(event.matches)
    }
    phoneViewport.addEventListener('change', adaptPanel)
    return () => phoneViewport.removeEventListener('change', adaptPanel)
  }, [])

  return <aside className="sidebar" data-collapsed={collapsed} aria-label="Controles de la simulación">
    <header className="brand">
      <BikeIcon />
      <div className="brand-copy">
        <h1>Bicicletas GDL</h1>
        <span>MiBici</span>
      </div>
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
        aria-label={phoneLayout
          ? collapsed ? 'Expandir controles' : 'Contraer controles'
          : collapsed ? 'Mostrar panel' : 'Ocultar panel'}
        aria-controls="sidebar-content"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((value) => !value)}
      >
        <span className="desktop-panel-toggle-icon"><PanelToggleIcon collapsed={collapsed} /></span>
        {collapsed
          ? <CaretUp className="phone-panel-toggle-icon" size={22} weight="bold" aria-hidden="true" />
          : <CaretDown className="phone-panel-toggle-icon" size={22} weight="bold" aria-hidden="true" />}
      </button>
    </header>

    <div id="sidebar-content" hidden={collapsed}>
    <div className="date-selection">
      <label>Día de reproducción
        <select className="select" value={selectedDate} onChange={(event) => onDateChange(event.target.value)}>
          {days.map((day) => <option key={day.date} value={day.date}>{formatDateOption(day)}</option>)}
        </select>
      </label>
    </div>

    <span className="section-label playback-label">Reproducción</span>
    <div className="playback-controls">
      <button className="play-button" type="button" aria-label={playing ? 'Pausar' : 'Reproducir'} disabled={loading || !filteredCount} onClick={() => setPlaying((current) => !current)}>
        <PlayIcon playing={playing} />
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
      <h2 id="filters-title">Género del usuario</h2>
      <div className="gender-grid">
        {GENDERS.map((code) => <GenderButton key={code} code={code} active={genders.includes(code)} onClick={() => toggleGender(code)} />)}
      </div>

    </section>
    </div>
  </aside>
}
