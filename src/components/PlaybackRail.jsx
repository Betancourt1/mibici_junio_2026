import { PLAYBACK_SECONDS } from '../config.js'

function formatClock(seconds) {
  const total = Math.round(seconds)
  const values = [Math.floor(total / 3600), Math.floor(total % 3600 / 60), total % 60]
  return values.map((value) => String(value).padStart(2, '0')).join(':')
}

export default function PlaybackRail({ bins, currentTime, activeCount, onTimeChange, disabled }) {
  const max = Math.max(1, ...bins)
  const barWidth = 100 / bins.length
  const currentBin = Math.min(bins.length - 1, Math.floor(currentTime / PLAYBACK_SECONDS * bins.length))
  const currentX = currentTime / PLAYBACK_SECONDS * 100

  return <section className="playback-rail" aria-label="Hora y distribución de viajes activos">
    <strong className="playback-rail-time">{formatClock(currentTime)}</strong>
    <div className="playback-rail-chart">
      <svg
        viewBox="0 0 100 34"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Distribución de viajes activos durante el día. Máximo ${max.toLocaleString('es-MX')}; ${activeCount.toLocaleString('es-MX')} ahora.`}
      >
        {bins.map((count, index) => {
          const height = Math.max(1, count / max * 30)
          return <rect
            key={index}
            className={index === currentBin ? 'rail-bar rail-bar-current' : 'rail-bar'}
            x={index * barWidth}
            y={34 - height}
            width={Math.max(0.45, barWidth * 0.72)}
            height={height}
          />
        })}
        <line className="rail-time-marker" x1={currentX} x2={currentX} y1="0" y2="34" />
      </svg>
      <div className="playback-rail-range">
        <span>00:00</span>
        <input
          type="range"
          min="0"
          max={PLAYBACK_SECONDS}
          step="60"
          value={Math.round(currentTime)}
          disabled={disabled}
          aria-label="Hora del día"
          onChange={(event) => onTimeChange(Number(event.target.value))}
        />
        <span>24:00</span>
      </div>
    </div>
    <div className="playback-rail-active" aria-live="polite">
      <strong>{activeCount.toLocaleString('es-MX')}</strong>
      <span>activas</span>
    </div>
  </section>
}
