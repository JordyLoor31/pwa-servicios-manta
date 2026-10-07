export type UnidadCobro = 'por_hora' | 'por_servicio';

export interface CategoriaSolicitudView {
  id: string;
  nombre: string;
  icono: string | null;
}

export interface SolicitudFila {
  id: string;
  estado: unknown;
  descripcion: unknown;
  direccion: unknown;
  direccion_latitud: unknown;
  direccion_longitud: unknown;
  motivo_rechazo: unknown;
  fecha_propuesta: unknown;
  hora_propuesta: unknown;
  hora_fin_estimada: unknown;
  fecha_solicitud: unknown;
  fecha_aceptacion: unknown;
  fecha_completada: unknown;
  duracion_oferta_minutos: unknown;
  fecha_expiracion_oferta: unknown;
  cliente_id: string;
  cliente_nombres: unknown;
  cliente_apellidos: unknown;
  tecnico_id: string | null;
  tecnico_nombres: unknown;
  tecnico_apellidos: unknown;
}

export function columnasBase() {
  return [
    's.id AS id',
    's.estado AS estado',
    's.descripcion AS descripcion',
    's.direccion AS direccion',
    's.direccion_latitud AS direccion_latitud',
    's.direccion_longitud AS direccion_longitud',
    's.motivo_rechazo AS motivo_rechazo',
    's.fecha_propuesta AS fecha_propuesta',
    's.hora_propuesta AS hora_propuesta',
    's.hora_fin_estimada AS hora_fin_estimada',
    's.fecha_solicitud AS fecha_solicitud',
    's.fecha_aceptacion AS fecha_aceptacion',
    's.fecha_completada AS fecha_completada',
    's.duracion_oferta_minutos AS duracion_oferta_minutos',
    's.fecha_expiracion_oferta AS fecha_expiracion_oferta',
    'cli.id AS cliente_id',
    'cli.nombres AS cliente_nombres',
    'cli.apellidos AS cliente_apellidos',
    'tec.id AS tecnico_id',
    'tec.nombres AS tecnico_nombres',
    'tec.apellidos AS tecnico_apellidos',
  ];
}

export function toSolicitudView(
  fila: SolicitudFila,
  unidadesCobro: Map<string, UnidadCobro>,
  categoriasPorSolicitud: Map<string, CategoriaSolicitudView[]>,
) {
  return {
    id: fila.id,
    estado: fila.estado,
    descripcion: fila.descripcion,
    direccion: fila.direccion,
    direccion_latitud: fila.direccion_latitud != null ? Number(fila.direccion_latitud) : null,
    direccion_longitud: fila.direccion_longitud != null ? Number(fila.direccion_longitud) : null,
    motivo_rechazo: fila.motivo_rechazo,
    fecha_propuesta: fila.fecha_propuesta,
    hora_propuesta: fila.hora_propuesta,
    hora_fin_estimada: fila.hora_fin_estimada,
    fecha_solicitud: fila.fecha_solicitud,
    fecha_aceptacion: fila.fecha_aceptacion,
    fecha_completada: fila.fecha_completada,
    duracion_oferta_minutos: fila.duracion_oferta_minutos ?? null,
    fecha_expiracion_oferta: fila.fecha_expiracion_oferta ?? null,
    cliente: {
      id: fila.cliente_id,
      nombres: fila.cliente_nombres,
      apellidos: fila.cliente_apellidos,
    },
    tecnico: fila.tecnico_id
      ? {
          id: fila.tecnico_id,
          nombres: fila.tecnico_nombres,
          apellidos: fila.tecnico_apellidos,
        }
      : null,
    unidad_cobro: fila.tecnico_id ? unidadesCobro.get(fila.tecnico_id) ?? null : null,
    categorias: categoriasPorSolicitud.get(fila.id) ?? [],
  };
}
