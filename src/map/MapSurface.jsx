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
import { COLORS, MAX_ZOOM, MIN_ZOOM } from '../config.js'
import { pointAlong, project, TILE_SIZE, unproject } from './mercator.js'

const MapSurface = forwardRef(function MapSurface({
  trips,
  stationById,
  center,
  onCenterChange,
  zoom,
  onZoomChange,
  currentTime,
  statusMessage,
}, ref) {
  const containerRef = useRef(null)
  const stationCanvasRef = useRef(null)
  const bikeCanvasRef = useRef(null)
  const dragRef = useRef(null)
  const [size, setSize] = useState({ width: 1, height: 1 })
  const [dragging, setDragging] = useState(false)
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
          src: `https://a.basemaps.cartocdn.com/dark_all/${zoom}/${wrappedX}/${y}.png`,
          left: x * TILE_SIZE - worldX + size.width / 2,
          top: y * TILE_SIZE - worldY + size.height / 2,
        })
      }
    }

    return result
  }, [centerPoint.x, centerPoint.y, size.height, size.width, zoom])

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
      context.fillStyle = '#e9f3f5'
      context.fill()
      context.strokeStyle = '#071014'
      context.stroke()
    }
  }, [stationById, trips])

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

    for (const trip of trips) {
      const progress = (time - trip.start) / trip.duration
      if (progress < 0 || progress > 1) continue

      const point = pointAlong(trip, progress)
      const x = (point.x - view.centerPoint.x) * scale + view.size.width / 2
      const y = (point.y - view.centerPoint.y) * scale + view.size.height / 2
      if (x < -32 || y < -32 || x > view.size.width + 32 || y > view.size.height + 32) continue

      context.save()
      context.translate(x, y)
      context.rotate(point.angle)
      for (const [stroke, width] of [['rgba(3, 8, 12, .96)', 5], [COLORS[trip.gender] ?? COLORS.NULL, 2.5]]) {
        context.strokeStyle = stroke
        context.lineWidth = width
        for (let index = 0; index < 4; index += 1) {
          const offset = -index * 5.2
          context.beginPath()
          context.moveTo(offset - 4.5, -4.2)
          context.lineTo(offset, 0)
          context.lineTo(offset - 4.5, 4.2)
          context.stroke()
        }
      }
      context.restore()
    }
  }, [trips])

  useImperativeHandle(ref, () => ({ drawBikes }), [drawBikes])

  useEffect(() => {
    drawStations()
    drawBikes(currentTime)
  }, [centerPoint.x, centerPoint.y, currentTime, drawBikes, drawStations, size.height, size.width, zoom])

  function handlePointerDown(event) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, centerPoint }
    setDragging(true)
  }

  function handlePointerMove(event) {
    if (!dragRef.current) return
    const scale = 2 ** zoom
    const dx = event.clientX - dragRef.current.x
    const dy = event.clientY - dragRef.current.y
    onCenterChange(unproject(
      dragRef.current.centerPoint.x - dx / scale,
      dragRef.current.centerPoint.y - dy / scale,
    ))
  }

  function handlePointerUp(event) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    setDragging(false)
  }

  return <main
    ref={containerRef}
    className="map-surface"
    data-dragging={dragging}
    role="application"
    tabIndex="0"
    aria-label="Mapa oscuro interactivo de Guadalajara. Arrastra para mover y usa la rueda o los controles para acercar y alejar."
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onPointerCancel={handlePointerUp}
    onLostPointerCapture={handlePointerUp}
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
    {statusMessage
      ? <div className="map-empty">{statusMessage}</div>
      : !trips.length && <div className="map-empty">Ninguna trayectoria coincide con los filtros actuales.</div>}
    <a className="map-attribution" href="https://carto.com/attributions" target="_blank" rel="noreferrer">
      © OpenStreetMap © CARTO
    </a>
  </main>
})

export default MapSurface
