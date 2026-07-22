import { useState } from 'react'
import {
  CalendarBlank,
  CaretUp,
  Moon,
  NavigationArrow,
  Pause,
  Play,
  Sun,
} from '@phosphor-icons/react'
import { COLORS, PLAYBACK_SECONDS } from '../config.js'

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const SPEEDS = [1, 60, 300, 1800]

function formatClock(seconds) {
  const total = Math.round(seconds)
  const values = [Math.floor(total / 3600), Math.floor(total % 3600 / 60), total % 60]
  return values.map((value) => String(value).padStart(2, '0')).join(':')
}

function formatDate(date) {
  const [year, month, day] = date.split('-').map(Number)
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}`
}

function GenderLegend() {
  return <div className="gender-legend" aria-label="Colores por género">
    <span style={{ '--legend-color': COLORS.F }}><NavigationArrow weight="fill" aria-hidden="true" />Mujer</span>
    <span style={{ '--legend-color': COLORS.M }}><NavigationArrow weight="fill" aria-hidden="true" />Hombre</span>
  </div>
}

function SpeedControl({ speed, setSpeed }) {
  return <div className="speed-control" aria-label="Velocidad de reproducción">
    {SPEEDS.map((value) => <button
      key={value}
      type="button"
      aria-pressed={speed === value}
      onClick={() => setSpeed(value)}
    >{value}×</button>)}
  </div>
}

function DateControl({ days, selectedDate, onDateChange, compact = false }) {
  return <label className="date-control" data-compact={compact}>
    {!compact && <CalendarBlank size={18} weight="bold" aria-hidden="true" />}
    <span className="visually-hidden">Día de reproducción</span>
    <select value={selectedDate} onChange={(event) => onDateChange(event.target.value)}>
      {days.map((day) => <option key={day.date} value={day.date}>{formatDate(day.date)}</option>)}
    </select>
  </label>
}

function PlayButton({ playing, setPlaying, disabled, className = '' }) {
  const Icon = playing ? Pause : Play
  return <button
    className={`hud-play-button ${className}`}
    type="button"
    aria-label={playing ? 'Pausar' : 'Reproducir'}
    disabled={disabled}
    onClick={() => setPlaying((current) => !current)}
  >
    <Icon size={20} weight="fill" aria-hidden="true" />
  </button>
}

function makePolyline(bins, max) {
  if (!bins.length) return ''
  return bins.map((count, index) => {
    const x = bins.length === 1 ? 50 : index / (bins.length - 1) * 100
    const y = 36 - count / max * 29
    return `${x},${y}`
  }).join(' ')
}

function DistributionChart({ bins, genderBins, currentTime, activeCount, onTimeChange, disabled }) {
  const max = Math.max(1, ...bins)
  const barWidth = 100 / Math.max(1, bins.length)
  const currentBin = Math.min(bins.length - 1, Math.floor(currentTime / PLAYBACK_SECONDS * bins.length))
  const currentX = currentTime / PLAYBACK_SECONDS * 100

  return <div className="distribution-chart">
    <div className="timeline-plot">
      <svg
        viewBox="0 0 100 38"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Distribución de viajes activos durante el día. Máximo ${max.toLocaleString('es-MX')}; ${activeCount.toLocaleString('es-MX')} ahora.`}
      >
        {bins.map((count, index) => {
          const height = Math.max(.8, count / max * 29)
          return <rect
            key={index}
            className={index === currentBin ? 'distribution-bar distribution-bar-current' : 'distribution-bar'}
            x={index * barWidth}
            y={36 - height}
            width={Math.max(.35, barWidth * .7)}
            height={height}
          />
        })}
        <polyline className="gender-series gender-series-women" points={makePolyline(genderBins.F, max)} />
        <polyline className="gender-series gender-series-men" points={makePolyline(genderBins.M, max)} />
        <line className="distribution-time-marker" x1={currentX} x2={currentX} y1="1" y2="37" />
        <circle className="distribution-time-handle" cx={currentX} cy="36" r="1.25" />
      </svg>
      <input
        className="timeline-input"
        type="range"
        min="0"
        max={PLAYBACK_SECONDS}
        step="60"
        value={Math.round(currentTime)}
        disabled={disabled}
        aria-label="Hora del día"
        onChange={(event) => onTimeChange(Number(event.target.value))}
      />
    </div>
    <div className="timeline-endpoints" aria-hidden="true">
      <span>00:00</span>
      <span>24:00</span>
    </div>
  </div>
}

export default function SimulationHud({
  days,
  selectedDate,
  onDateChange,
  tripCount,
  playing,
  setPlaying,
  speed,
  setSpeed,
  theme,
  setTheme,
  loading,
  bins,
  genderBins,
  currentTime,
  activeCount,
  onTimeChange,
}) {
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false)
  const disabled = loading || !tripCount
  const ThemeIcon = theme === 'dark' ? Sun : Moon

  return <div className="simulation-hud">
    <header className="map-header">
      <h1>MiBici GDL</h1>
      <button
        className="theme-button"
        type="button"
        aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro'}
        title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
        onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
      >
        <ThemeIcon size={24} weight="regular" aria-hidden="true" />
      </button>
    </header>

    <section className="desktop-transport" aria-label="Controles de la simulación">
      <DateControl days={days} selectedDate={selectedDate} onDateChange={onDateChange} compact />
      <span className="hud-divider" aria-hidden="true" />
      <PlayButton playing={playing} setPlaying={setPlaying} disabled={disabled} />
      <span className="hud-divider" aria-hidden="true" />
      <SpeedControl speed={speed} setSpeed={setSpeed} />
    </section>

    <div className="desktop-gender-legend"><GenderLegend /></div>

    <section className="desktop-timeline" aria-label="Hora y distribución de viajes activos">
      <strong>{formatClock(currentTime)}</strong>
      <DistributionChart
        bins={bins}
        genderBins={genderBins}
        currentTime={currentTime}
        activeCount={activeCount}
        onTimeChange={onTimeChange}
        disabled={loading}
      />
      <div className="active-riders" aria-live="polite">
        <strong>{activeCount.toLocaleString('es-MX')}</strong>
        <span>activas</span>
      </div>
    </section>

    <section className="mobile-hud" data-settings-open={mobileSettingsOpen} aria-label="Controles de la simulación">
      {mobileSettingsOpen && <div className="mobile-settings">
        <DateControl days={days} selectedDate={selectedDate} onDateChange={onDateChange} />
        <SpeedControl speed={speed} setSpeed={setSpeed} />
      </div>}

      <div className="mobile-primary-row">
        <PlayButton playing={playing} setPlaying={setPlaying} disabled={disabled} className="mobile-play-button" />
        <div className="mobile-now">
          <strong>{formatClock(currentTime)}</strong>
          <span>{activeCount.toLocaleString('es-MX')} activas</span>
        </div>
        <button
          className="mobile-settings-toggle"
          type="button"
          aria-expanded={mobileSettingsOpen}
          aria-label={mobileSettingsOpen ? 'Ocultar fecha y velocidad' : 'Mostrar fecha y velocidad'}
          onClick={() => setMobileSettingsOpen((current) => !current)}
        >
          <span>Fecha · {speed}×</span>
          <CaretUp size={17} weight="bold" aria-hidden="true" />
        </button>
      </div>

      <DistributionChart
        bins={bins}
        genderBins={genderBins}
        currentTime={currentTime}
        activeCount={activeCount}
        onTimeChange={onTimeChange}
        disabled={loading}
      />
      <GenderLegend />
    </section>
  </div>
}
