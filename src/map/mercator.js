export const TILE_SIZE = 256

export function project(lat, lng) {
  const sin = Math.sin(lat * Math.PI / 180)
  return {
    x: (lng + 180) / 360 * TILE_SIZE,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * TILE_SIZE,
  }
}

export function unproject(x, y) {
  const lng = x / TILE_SIZE * 360 - 180
  const n = Math.PI - 2 * Math.PI * y / TILE_SIZE
  return { lat: 180 / Math.PI * Math.atan(Math.sinh(n)), lng }
}

export function prepareTrip(trip) {
  const points = trip.route.map(([lat, lng]) => project(lat, lng))
  const lengths = []
  let routeLength = 0

  for (let index = 1; index < points.length; index += 1) {
    const length = Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].y - points[index - 1].y,
    )
    lengths.push(length)
    routeLength += length
  }

  return { ...trip, points, lengths, routeLength }
}

export function pointAlong(trip, progress) {
  let target = trip.routeLength * Math.max(0, Math.min(1, progress))

  for (let index = 0; index < trip.lengths.length; index += 1) {
    const length = trip.lengths[index]
    if (target <= length || index === trip.lengths.length - 1) {
      const start = trip.points[index]
      const end = trip.points[index + 1]
      const ratio = length ? Math.min(1, target / length) : 1
      return {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
        angle: Math.atan2(end.y - start.y, end.x - start.x),
      }
    }
    target -= length
  }

  return { ...trip.points.at(-1), angle: 0 }
}
