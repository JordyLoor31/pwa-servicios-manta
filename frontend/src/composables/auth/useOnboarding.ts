import { ApiError } from '../../services/api'
import { direccionesApi } from '../../services/direcciones'
import { disponibilidadApi } from '../../services/disponibilidad'
import { perfilTecnicoApi } from '../../services/perfil-tecnico'
import type { RolUsuario } from './useAuthz'

function numeroValido(valor: number | string | null | undefined): boolean {
  return valor != null && String(valor).trim() !== '' && Number.isFinite(Number(valor))
}

function horaValida(hora: string): boolean {
  if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(hora)) return false
  const partes = hora.split(':')
  const horas = Number(partes[0])
  const minutos = Number(partes[1])
  const segundos = Number(partes[2] ?? 0)
  return horas <= 23 && minutos <= 59 && segundos <= 59
}

export async function necesitaOnboarding(usuario: { id: string; rol: RolUsuario }) {
  if (usuario.rol === 'admin') return false

  const direcciones = await direccionesApi.listar()
  const tieneUbicacion = direcciones.some(
    (direccion) =>
      numeroValido(direccion.latitud) && numeroValido(direccion.longitud),
  )
  if (!tieneUbicacion) return true
  if (usuario.rol === 'cliente') return false

  let perfil
  try {
    perfil = await perfilTecnicoApi.obtener(usuario.id)
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) return true
    throw error
  }

  const [categorias, tarifas, disponibilidad] = await Promise.all([
    perfilTecnicoApi.obtenerCategorias(usuario.id),
    perfilTecnicoApi.obtenerTarifas(usuario.id),
    disponibilidadApi.listar(usuario.id),
  ])
  const experienciaValida =
    perfil.anios_experiencia != null &&
    Number.isFinite(Number(perfil.anios_experiencia)) &&
    Number(perfil.anios_experiencia) >= 0
  const radioValido =
    perfil.radio_cobertura_km != null &&
    Number.isFinite(Number(perfil.radio_cobertura_km)) &&
    Number(perfil.radio_cobertura_km) > 0
  const biografiaValida = typeof perfil.biografia === 'string' && perfil.biografia.trim().length > 0
  const categoriasConTarifasValidas =
    categorias.length > 0 &&
    categorias.every((categoria) =>
      tarifas.some(
        (tarifa) =>
          tarifa.categoria_id === categoria.id &&
          Number.isFinite(Number(tarifa.precio)) &&
          Number(tarifa.precio) >= 0 &&
          typeof tarifa.tipo_servicio === 'string' &&
          tarifa.tipo_servicio.trim().length > 0,
      ),
    )
  const disponibilidadValida = disponibilidad.some(
    (slot) =>
      Number.isInteger(slot.dia_semana) &&
      slot.dia_semana >= 0 &&
      slot.dia_semana <= 6 &&
      horaValida(slot.hora_inicio) &&
      horaValida(slot.hora_fin) &&
      slot.hora_fin > slot.hora_inicio,
  )

  return !(
    experienciaValida &&
    radioValido &&
    biografiaValida &&
    categoriasConTarifasValidas &&
    disponibilidadValida
  )
}
