import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Crosshair, Minus, Plus } from '@phosphor-icons/react'
import { COLORS, MAX_ZOOM, MIN_ZOOM } from '../config.js'
import { pointAlong, project, TILE_SIZE, unproject } from './mercator.js'

function drawRiderSymbol(context, symbol, color) {
  if (symbol === 'dot') {
    context.beginPath()
    context.arc(0, 0, 5, 0, Math.PI * 2)
    context.fillStyle = color
    context.fill()
    context.lineWidth = 2.5
    context.strokeStyle = 'rgba(3, 8, 12, .96)'
    context.stroke()
    return
  }

  for (const [fill, scale] of [['rgba(3, 8, 12, .96)', 1.35], [color, 1]]) {
    context.save()
    context.scale(scale, scale)
    context.beginPath()
    context.moveTo(7, 0)
    context.lineTo(-5, -5.5)
    context.lineTo(-2.3, 0)
    context.lineTo(-5, 5.5)
    context.closePath()
    context.fillStyle = fill
    context.fill()
    context.restore()
  }
}

const MapSurface = forwardRef(function MapSurface({
  trips,
  stationById,
  center,
  onCenterChange,
  zoom,
  onZoomChange,
  onCenter,
  currentTime,
  riderSymbol,
  theme,
  statusMessage,
}, ref) {
  const containerRef = useRef(null)
  const stationCanvasRef = useRef(null)
  const bikeCanvasRef = useRef(null)
  const activeRidersRef = useRef([])
  const dragRef = useRef(null)
  const hoveredTripIdRef = useRef(null)
  const pinnedTooltipRef = useRef(false)
  const lastTooltipUpdateRef = useRef(0)
  const [size, setSize] = useState({ width: 1, height: 1 })
  const [dragging, setDragging] = useState(false)
  const [riderDetails, setRiderDetails] = useState(null)
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2)
  const centerPoint = useMemo(() => project(center.lat, center.lng), [center.lat, center.lng])
  const viewRef = useRef({ centerPoint, zoom, size, dpr })
  viewRef.current = { centerPoint, zoom, size, dpr }

  useLayoutEffect(() => {
    const element = containerRef.current
    if (!element) return undefined

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: Math.max(1, entry.contentRect.width),
        height: Math.max(1, entry.contentRect.height),
      })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return undefined

    function handleWheel(event) {
      event.preventDefault()
      const direction = event.deltaY < 0 ? 1 : -1
      onZoomChange((current) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current + direction)))
    }

    element.addEventListener('wheel', handleWheel, { passive: false })
    return () => element.removeEventListener('wheel', handleWheel)
  }, [onZoomChange])

  const tiles = useMemo(() => {
    const scale = 2 ** zoom
    const worldX = centerPoint.x * scale
    const worldY = centerPoint.y * scale
    const startX = Math.floor((worldX - size.width / 2) / TILE_SIZE) - 1
    const endX = Math.floor((worldX + size.width / 2) / TILE_SIZE) + 1
    const startY = Math.max(0, Math.floor((worldY - size.height / 2) / TILE_SIZE) - 1)
    const endY = Math.min(scale - 1, Math.floor((worldY + size.height / 2) / TILE_SIZE) + 1)
    const result = []

    for (let x = startX; x <= endX; x += 1) {
      for (let y = startY; y <= endY; y += 1) {
        const wrappedX = (x % scale + scale) % scale
        result.push({
          key: `${zoom}/${x}/${y}`,
          src: `https://a.basemaps.cartocdn.com/${theme === 'light' ? 'light_all' : 'dark_all'}/${zoom}/${wrappedX}/${y}.png`,
          left: x * TILE_SIZE - worldX + size.width / 2,
          top: y * TILE_SIZE - worldY + size.height / 2,
        })
      }
    }

    return result
  }, [centerPoint.x, centerPoint.y, size.height, size.width, theme, zoom])

  const drawStations = useCallback(() => {
    const canvas = stationCanvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    const view = viewRef.current
    const scale = 2 ** view.zoom
    context.setTransform(view.dpr, 0, 0, view.dpr, 0, 0)
    context.clearRect(0, 0, view.size.width, view.size.height)

    const visibleStations = new Set()
    for (const trip of trips) {
      visibleStations.add(trip.origin)
      visibleStations.add(trip.destination)
    }

    context.lineWidth = 1.4
    for (const stationId of visibleStations) {
      const station = stationById.get(stationId)
      if (!station) continue

      const point = project(station.lat, station.lng)
      const x = (point.x - view.centerPoint.x) * scale + view.size.width / 2
      const y = (point.y - view.centerPoint.y) * scale + view.size.height / 2
      if (x < -8 || y < -8 || x > view.size.width + 8 || y > view.size.height + 8) continue

      context.beginPath()
      context.arc(x, y, view.zoom >= 16 ? 3.5 : 2.5, 0, Math.PI * 2)
      context.fillStyle = theme === 'light' ? '#172027' : '#e9f3f5'
      context.fill()
      context.strokeStyle = theme === 'light' ? '#ffffff' : '#071014'
      context.stroke()
    }
  }, [stationById, theme, trips])

  const drawBikes = useCallback((time) => {
    const canvas = bikeCanvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    const view = viewRef.current
    const scale = 2 ** view.zoom
    context.setTransform(view.dpr, 0, 0, view.dpr, 0, 0)
    context.clearRect(0, 0, view.size.width, view.size.height)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    const activeRiders = []

    for (const trip of trips) {
      const progress = (time - trip.start) / trip.duration
      if (progress < 0 || progress > 1) continue

      const point = pointAlong(trip, progress)
      const x = (point.x - view.centerPoint.x) * scale + view.size.width / 2
      const y = (point.y - view.centerPoint.y) * scale + view.size.height / 2
      if (x < -32 || y < -32 || x > view.size.width + 32 || y > view.size.height + 32) continue
      activeRiders.push({ trip, x, y })

      context.save()
      context.translate(x, y)
      if (trip.id === hoveredTripIdRef.current) {
        context.beginPath()
        context.arc(0, 0, 10, 0, Math.PI * 2)
        context.fillStyle = theme === 'light' ? 'rgba(255, 255, 255, .84)' : 'rgba(3, 8, 12, .8)'
        context.fill()
        context.lineWidth = 2
        context.strokeStyle = COLORS[trip.gender] ?? COLORS.NULL
        context.stroke()
      }
      context.rotate(point.angle)
      drawRiderSymbol(context, riderSymbol, COLORS[trip.gender] ?? COLORS.NULL)
      context.restore()
    }

    activeRidersRef.current = activeRiders
    if (hoveredTripIdRef.current && performance.now() - lastTooltipUpdateRef.current > 80) {
      const hovered = activeRiders.find(({ trip }) => trip.id === hoveredTripIdRef.current)
      if (hovered) {
        setRiderDetails((current) => current ? { ...current, x: hovered.x, y: hovered.y } : current)
        lastTooltipUpdateRef.current = performance.now()
      } else {
        hoveredTripIdRef.current = null
        pinnedTooltipRef.current = false
        setRiderDetails(null)
      }
    }
  }, [riderSymbol, theme, trips])

  useImperativeHandle(ref, () => ({ drawBikes }), [drawBikes])

  useEffect(() => {
    drawStations()
    drawBikes(currentTime)
  }, [centerPoint.x, centerPoint.y, currentTime, drawBikes, drawStations, size.height, size.width, zoom])

  function handlePointerDown(event) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      centerPoint,
      moved: false,
    }
    setDragging(true)
  }

  function handlePointerMove(event) {
    if (!dragRef.current) {
      if (event.pointerType !== 'touch') showNearestRider(event.clientX, event.clientY, 17, false)
      return
    }
    const scale = 2 ** zoom
    const dx = event.clientX - dragRef.current.x
    const dy = event.clientY - dragRef.current.y
    if (Math.hypot(dx, dy) > 4) dragRef.current.moved = true
    if (!dragRef.current.moved) return
    clearRiderDetails()
    onCenterChange(unproject(
      dragRef.current.centerPoint.x - dx / scale,
      dragRef.current.centerPoint.y - dy / scale,
    ))
  }

  function handlePointerUp(event) {
    if (dragRef.current && !dragRef.current.moved) {
      showNearestRider(event.clientX, event.clientY, event.pointerType === 'touch' ? 28 : 17, true)
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    setDragging(false)
  }

  function clearRiderDetails() {
    if (!hoveredTripIdRef.current) return
    hoveredTripIdRef.current = null
    pinnedTooltipRef.current = false
    setRiderDetails(null)
    drawBikes(currentTime)
  }

  function showNearestRider(clientX, clientY, radius, pinned) {
    const bounds = containerRef.current?.getBoundingClientRect()
    if (!bounds) return
    const x = clientX - bounds.left
    const y = clientY - bounds.top
    let nearest = null
    let nearestDistance = radius

    for (const rider of activeRidersRef.current) {
      const distance = Math.hypot(rider.x - x, rider.y - y)
      if (distance <= nearestDistance) {
        nearest = rider
        nearestDistance = distance
      }
    }

    if (!nearest) {
      if (!pinnedTooltipRef.current) clearRiderDetails()
      return
    }

    hoveredTripIdRef.current = nearest.trip.id
    pinnedTooltipRef.current = pinned
    setRiderDetails({ ...nearest, pinned })
    drawBikes(currentTime)
  }

  const tooltipStation = (stationId) => stationById.get(stationId)?.name ?? `Estación ${stationId}`
  const tooltipAge = (birthYear) => Number.isInteger(birthYear) && birthYear >= 1900 && birthYear <= 2026
    ? `${2026 - birthYear} años`
    : 'Sin dato'
  const tooltipLeft = riderDetails
    ? Math.max(Math.min(150, size.width / 2), Math.min(size.width - Math.min(150, size.width / 2), riderDetails.x))
    : 0
  const tooltipBelow = riderDetails?.y < 155

  return <main
    ref={containerRef}
    className="map-surface"
    data-dragging={dragging}
    role="application"
    tabIndex="0"
    aria-label={`Mapa ${theme === 'light' ? 'claro' : 'oscuro'} interactivo de Guadalajara. Arrastra para mover y usa la rueda o los controles para acercar y alejar.`}
    data-theme={theme}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onPointerCancel={handlePointerUp}
    onLostPointerCapture={handlePointerUp}
    onPointerLeave={() => {
      if (!dragRef.current && !pinnedTooltipRef.current) clearRiderDetails()
    }}
  >
    <div className="tile-layer" aria-hidden="true">
      {tiles.map((tile) => <img
        key={tile.key}
        className="map-tile"
        src={tile.src}
        alt=""
        draggable="false"
        style={{ left: tile.left, top: tile.top }}
      />)}
    </div>
    <canvas
      ref={stationCanvasRef}
      className="map-canvas"
      width={Math.max(1, Math.round(size.width * dpr))}
      height={Math.max(1, Math.round(size.height * dpr))}
      aria-hidden="true"
    />
    <canvas
      ref={bikeCanvasRef}
      className="map-canvas"
      width={Math.max(1, Math.round(size.width * dpr))}
      height={Math.max(1, Math.round(size.height * dpr))}
      aria-hidden="true"
    />
    {riderDetails && <div
      className="rider-tooltip"
      data-placement={tooltipBelow ? 'below' : 'above'}
      role="status"
      style={{ left: tooltipLeft, top: riderDetails.y }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {riderDetails.pinned && <button type="button" aria-label="Cerrar detalles del viaje" onClick={clearRiderDetails}>×</button>}
      <strong>Usuario {riderDetails.trip.user}</strong>
      <span><b>Edad aprox.</b>{tooltipAge(riderDetails.trip.birth)}</span>
      <span><b>Origen</b>{tooltipStation(riderDetails.trip.origin)}</span>
      <span><b>Destino</b>{tooltipStation(riderDetails.trip.destination)}</span>
    </div>}
    {statusMessage
      ? <div className="map-empty">{statusMessage}</div>
      : !trips.length && <div className="map-empty">Ninguna trayectoria coincide con los filtros actuales.</div>}
    <div
      className="map-navigation"
      role="group"
      aria-label={`Controles del mapa. Nivel ${zoom}`}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button className="map-recenter" type="button" aria-label="Centrar mapa en Guadalajara" onClick={onCenter}>
        <Crosshair size={31} weight="bold" aria-hidden="true" />
      </button>
      <div className="map-zoom-stack">
        <button type="button" aria-label="Acercar mapa" disabled={zoom >= MAX_ZOOM} onClick={() => onZoomChange((current) => Math.min(MAX_ZOOM, current + 1))}>
          <Plus size={31} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Alejar mapa" disabled={zoom <= MIN_ZOOM} onClick={() => onZoomChange((current) => Math.max(MIN_ZOOM, current - 1))}>
          <Minus size={31} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </div>
    <a className="map-attribution" href="https://carto.com/attributions" target="_blank" rel="noreferrer">
      © OpenStreetMap © CARTO
    </a>
  </main>
})

export default MapSurface
