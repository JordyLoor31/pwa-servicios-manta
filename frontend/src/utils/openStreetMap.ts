interface DireccionMap {
  direccion?: string | null
  latitud?: number | null
  longitud?: number | null
}

export function urlOpenStreetMap({ direccion, latitud, longitud }: DireccionMap) {
  if (latitud != null && longitud != null) {
    return `https://www.openstreetmap.org/?mlat=${latitud}&mlon=${longitud}#map=16/${latitud}/${longitud}`
  }
  return direccion
    ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(direccion)}`
    : '#'
}
