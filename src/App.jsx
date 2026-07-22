import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import {
  DEFAULT_CENTER,
  DEFAULT_FILTERS,
  GENDERS,
  PLAYBACK_SECONDS,
} from './config.js'
import { MONTH_MANIFEST } from './data/manifest.js'
import MapSurface from './map/MapSurface.jsx'
import { prepareTrip } from './map/mercator.js'

const ACTIVITY_BIN_SECONDS = 15 * 60
const ACTIVITY_BIN_COUNT = PLAYBACK_SECONDS / ACTIVITY_BIN_SECONDS

function unpackTrips(data) {
  const hourStart = data.hour * 3600
  return data.trips.map((row) => prepareTrip({
    id: row[0],
    user: row[1],
    gender: row[2],
    birth: row[3],
    start: hourStart + row[4],
    duration: row[5],
    origin: row[6],
    destination: row[7],
    route: data.routes[row[8]],
  }))
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

  useEffect(() => {
    const media = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!media) return undefined
    const update = () => setReduced(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

function countActiveTripsByInterval(trips) {
  const changes = new Array(ACTIVITY_BIN_COUNT + 1).fill(0)

  for (const trip of trips) {
    const firstBin = Math.max(0, Math.ceil(trip.start / ACTIVITY_BIN_SECONDS))
    const lastBin = Math.min(ACTIVITY_BIN_COUNT - 1, Math.floor((trip.start + trip.duration) / ACTIVITY_BIN_SECONDS))
    if (firstBin > lastBin) continue
    changes[firstBin] += 1
    changes[lastBin + 1] -= 1
  }

  let active = 0
  return changes.slice(0, ACTIVITY_BIN_COUNT).map((change) => {
    active += change
    return active
  })
}

export default function App() {
  const initialSelection = MONTH_MANIFEST.defaultSelection
  const initialTime = initialSelection.hour * 3600 + initialSelection.second
  const reduceMotion = usePrefersReducedMotion()
  const rendererRef = useRef(null)
  const timeRef = useRef(initialTime)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [genders, setGenders] = useState([...GENDERS])
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [zoom, setZoom] = useState(13)
  const [speed, setSpeed] = useState(300)
  const [riderSymbol, setRiderSymbol] = useState('arrow')
  const [theme, setTheme] = useState('dark')
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTimeState] = useState(initialTime)
  const [selectedDate, setSelectedDate] = useState(initialSelection.date)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const stations = MONTH_MANIFEST.stations

  useEffect(() => {
    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.content = theme === 'light' ? '#edf2f4' : '#080d11'
  }, [theme])

  const stationById = useMemo(
    () => new Map(stations.map((station) => [station.id, station])),
    [stations],
  )

  const setCurrentTime = useCallback((next) => {
    const value = Math.max(0, Math.min(PLAYBACK_SECONDS, next))
    timeRef.current = value
    setCurrentTimeState(value)
    rendererRef.current?.drawBikes(value)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const selectedDay = MONTH_MANIFEST.days.find((day) => day.date === selectedDate)
    const initialSecond = selectedDate === initialSelection.date ? initialTime : 0

    setLoading(true)
    setLoadError('')
    setTrips([])
    setPlaying(false)
    timeRef.current = initialSecond
    setCurrentTimeState(initialSecond)

    Promise.all(selectedDay.hours.map(async ({ hour }) => {
      const paddedHour = String(hour).padStart(2, '0')
      const response = await fetch(`/data/hours/${selectedDate}-${paddedHour}.json`, { signal: controller.signal })
      if (!response.ok) throw new Error(`No se pudo cargar el día (${response.status})`)
      return response.json()
    }))
      .then((hours) => {
        setTrips(hours.flatMap(unpackTrips))
        setLoading(false)
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setTrips([])
        setLoadError(error.message)
        setLoading(false)
      })

    return () => controller.abort()
  }, [initialSelection.date, initialTime, selectedDate])

  const filteredTrips = useMemo(() => {
    const birthFrom = filters.birthFrom === '' ? null : Number(filters.birthFrom)
    const birthTo = filters.birthTo === '' ? null : Number(filters.birthTo)

    return trips.filter((trip) => {
      if (!genders.includes(trip.gender)) return false
      if (birthFrom !== null && (trip.birth === null || trip.birth < birthFrom)) return false
      if (birthTo !== null && (trip.birth === null || trip.birth > birthTo)) return false
      return true
    })
  }, [filters, genders, trips])

  const activeCount = useMemo(
    () => filteredTrips.filter((trip) => currentTime >= trip.start && currentTime <= trip.start + trip.duration).length,
    [currentTime, filteredTrips],
  )

  const activityBins = useMemo(
    () => countActiveTripsByInterval(filteredTrips),
    [filteredTrips],
  )

  useEffect(() => {
    if (!playing) return undefined

    let frameId
    let previous = performance.now()
    let uiElapsed = 0

    function animate(now) {
      const elapsed = now - previous
      previous = now
      let next = timeRef.current + elapsed / 1000 * speed
      if (next >= PLAYBACK_SECONDS) next %= PLAYBACK_SECONDS
      timeRef.current = next
      uiElapsed += elapsed

      if (!reduceMotion || uiElapsed >= 250) rendererRef.current?.drawBikes(next)
      if (uiElapsed >= 100) {
        setCurrentTimeState(next)
        uiElapsed = 0
      }
      frameId = requestAnimationFrame(animate)
    }

    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [playing, reduceMotion, speed])

  useEffect(() => {
    function handleKeyDown(event) {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName)) return
      if (event.code === 'Space') {
        event.preventDefault()
        if (!loading && filteredTrips.length) setPlaying((value) => !value)
      } else if (event.key === 'ArrowLeft') {
        setCurrentTime(timeRef.current - 30)
      } else if (event.key === 'ArrowRight') {
        setCurrentTime(timeRef.current + 30)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredTrips.length, loading, setCurrentTime])

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
    setGenders([...GENDERS])
  }

  function centerGuadalajara() {
    setCenter(DEFAULT_CENTER)
    setZoom(13)
  }

  const mapMessage = loading
    ? 'Cargando viajes del día…'
    : loadError
      ? loadError
      : ''

  return <div className="app-shell" data-theme={theme}>
    <Sidebar
      summary={MONTH_MANIFEST.summary}
      days={MONTH_MANIFEST.days}
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      filters={filters}
      setFilters={setFilters}
      genders={genders}
      setGenders={setGenders}
      filteredCount={filteredTrips.length}
      activeCount={activeCount}
      activityBins={activityBins}
      currentTime={currentTime}
      setCurrentTime={setCurrentTime}
      playing={playing}
      setPlaying={setPlaying}
      speed={speed}
      setSpeed={setSpeed}
      riderSymbol={riderSymbol}
      setRiderSymbol={setRiderSymbol}
      theme={theme}
      setTheme={setTheme}
      zoom={zoom}
      setZoom={setZoom}
      onCenter={centerGuadalajara}
      onReset={resetFilters}
      loading={loading}
    />
    <MapSurface
      ref={rendererRef}
      trips={filteredTrips}
      stationById={stationById}
      center={center}
      onCenterChange={setCenter}
      zoom={zoom}
      onZoomChange={setZoom}
      currentTime={currentTime}
      riderSymbol={riderSymbol}
      theme={theme}
      statusMessage={mapMessage}
    />
  </div>
}
