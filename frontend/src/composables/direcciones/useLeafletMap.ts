export interface LatLng {
  lat: number
  lng: number
}

export interface LeafletMarker {
  setLatLng: (latlng: LatLng) => void
  getLatLng: () => LatLng
  remove: () => void
  addTo: (mapa: LeafletMap) => LeafletMarker
  on: (evento: string, callback: () => void) => void
}

export interface LeafletMap {
  setView: (lat: number, lng: number, zoom?: number) => LeafletMap
  on: (evento: string, callback: (event?: { latlng?: LatLng }) => void) => void
  remove: () => void
  invalidateSize: () => void
}

interface LeafletApi {
  map: (contenedor: HTMLElement, opciones: Record<string, unknown>) => LeafletMap
  tileLayer: (url: string, opciones: Record<string, unknown>) => { addTo: (mapa: LeafletMap) => void }
  marker: (latlng: [number, number], opciones?: Record<string, unknown>) => LeafletMarker
}

interface WindowLeaflet {
  L?: LeafletApi
}

const CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

let cargandoLeaflet: Promise<void> | null = null

function asegurarLink() {
  if (document.querySelector(`link[href="${CSS_URL}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = CSS_URL
  document.head.appendChild(link)
}

function cargarLeaflet(): Promise<void> {
  if (!cargandoLeaflet) {
    asegurarLink()
    cargandoLeaflet = new Promise((resolve, reject) => {
      const ventana = window as unknown as WindowLeaflet
      if (ventana.L) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = JS_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        cargandoLeaflet = null
        reject(new Error('No se pudo cargar el mapa'))
      }
      document.head.appendChild(script)
    })
  }
  return cargandoLeaflet
}

export function useLeafletMap() {
  async function crearMapa(
    contenedor: HTMLElement,
    centro: LatLng,
    alCambiar: (latlng: LatLng) => void,
  ) {
    await cargarLeaflet()
    const ventana = window as unknown as WindowLeaflet
    const L = ventana.L
    if (!L) throw new Error('Leaflet no está disponible')
    const mapa = L.map(contenedor, { center: [centro.lat, centro.lng], zoom: 15 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapa)
    const marcador = L.marker([centro.lat, centro.lng], { draggable: true })
    marcador.setLatLng(centro)
    marcador.addTo(mapa)
    mapa.on('click', (evento) => {
      const latlng = evento?.latlng
      if (latlng) {
        marcador.setLatLng(latlng)
        alCambiar(latlng)
      }
    })
    marcador.on?.('dragend', () => {
      const posicion = marcador.getLatLng()
      alCambiar(posicion)
    })
    return { mapa, marcador }
  }

  return { crearMapa }
}
