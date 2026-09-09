export interface DisponibilidadSlot {
  id: string
  tecnico_id: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
}

export interface SlotDisponibilidad {
  dia_semana: number
  hora_inicio: string
  hora_fin: string
}

export interface EditableSlot extends SlotDisponibilidad {
  id?: string
}

export interface ReemplazarDisponibilidadPayload {
  disponibilidad: SlotDisponibilidad[]
}