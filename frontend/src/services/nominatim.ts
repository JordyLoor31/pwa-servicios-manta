export interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
  }
}

export async function buscarReverso(latitud: number, longitud: number): Promise<NominatimResult | null> {
  const parametros = new URLSearchParams({
    format: 'json',
    addressdetails: '1',
    lat: String(latitud),
    lon: String(longitud),
    zoom: '18',
    'accept-language': 'es',
  })
  const respuesta = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${parametros.toString()}`,
  )
  if (!respuesta.ok) {
    throw new Error('No se pudo obtener la dirección')
  }
  const datos = await respuesta.json()
  return Array.isArray(datos) && datos.length > 0 ? datos[0] : datos && datos.display_name ? datos : null
}

export async function buscarDirecciones(query: string): Promise<NominatimResult[]> {
  const parametros = new URLSearchParams({
    format: 'json',
    addressdetails: '1',
    countrycodes: 'ec',
    limit: '5',
    q: query,
    'accept-language': 'es',
  })
  const respuesta = await fetch(
    `https://nominatim.openstreetmap.org/search?${parametros.toString()}`,
  )
  if (!respuesta.ok) {
    throw new Error('No se pudo buscar la dirección')
  }
  return respuesta.json()
}
