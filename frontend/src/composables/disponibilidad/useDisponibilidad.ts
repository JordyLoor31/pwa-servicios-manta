import { computed, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthz } from '../auth/useAuthz'
import { api } from '../../services/api'
import type { DisponibilidadSlot, EditableSlot, SlotDisponibilidad } from '../../types/disponibilidad'

export const DIAS_SEMANA: { valor: number; nombre: string }[] = [
  { valor: 1, nombre: 'Lunes' },
  { valor: 2, nombre: 'Martes' },
  { valor: 3, nombre: 'Miércoles' },
  { valor: 4, nombre: 'Jueves' },
  { valor: 5, nombre: 'Viernes' },
  { valor: 6, nombre: 'Sábado' },
  { valor: 0, nombre: 'Domingo' },
]

export function nombreDia(dia: number) {
  return DIAS_SEMANA.find((d) => d.valor === dia)?.nombre ?? `Día ${dia}`
}

export function useDisponibilidad() {
  const toast = useToast()
  const { usuario } = useAuthz()
  const usuarioId = computed(() => usuario.value?.id)

  const cargando = ref(false)
  const guardando = ref(false)
  const slots = ref<EditableSlot[]>([])

  const dias = computed(() =>
    DIAS_SEMANA.map((dia) => ({
      ...dia,
      slots: slots.value.filter((s) => s.dia_semana === dia.valor),
    })),
  )

  const totalSlots = computed(() => slots.value.length)

  async function cargar() {
    const id = usuarioId.value
    if (!id) return
    cargando.value = true
    try {
      const datos = await api.get<DisponibilidadSlot[]>(`/perfiles-tecnico/${id}/disponibilidad`)
      slots.value = datos.map((s) => ({
        id: s.id,
        dia_semana: s.dia_semana,
        hora_inicio: s.hora_inicio.slice(0, 5),
        hora_fin: s.hora_fin.slice(0, 5),
      }))
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo cargar tu disponibilidad',
        life: 4000,
      })
      slots.value = []
    } finally {
      cargando.value = false
    }
  }

  function agregarSlot(dia: number) {
    slots.value.push({ dia_semana: dia, hora_inicio: '08:00', hora_fin: '17:00' })
  }

  function quitarSlot(index: number) {
    slots.value.splice(index, 1)
  }

  function vaciar() {
    slots.value = []
  }

  function validar(): boolean {
    const patron = /^\d{2}:\d{2}$/
    for (const slot of slots.value) {
      if (
        !patron.test(slot.hora_inicio) ||
        !patron.test(slot.hora_fin) ||
        slot.hora_fin <= slot.hora_inicio
      ) {
        toast.add({
          severity: 'warn',
          summary: 'Horario inválido',
          detail: `En ${nombreDia(slot.dia_semana)} la hora de fin debe ser posterior a la de inicio.`,
          life: 4000,
        })
        return false
      }
    }
    return true
  }

  async function guardar(): Promise<boolean> {
    const id = usuarioId.value
    if (!id || !validar()) return false
    guardando.value = true
    try {
      const payload: SlotDisponibilidad[] = slots.value.map(({ dia_semana, hora_inicio, hora_fin }) => ({
        dia_semana,
        hora_inicio,
        hora_fin,
      }))
      await api.put<DisponibilidadSlot[]>(`/perfiles-tecnico/${id}/disponibilidad`, {
        disponibilidad: payload,
      })
      toast.add({ severity: 'success', summary: 'Disponibilidad guardada', life: 3000 })
      await cargar()
      return true
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo guardar tu disponibilidad',
        life: 4000,
      })
      return false
    } finally {
      guardando.value = false
    }
  }

  return {
    cargando,
    guardando,
    slots,
    dias,
    totalSlots,
    cargar,
    agregarSlot,
    quitarSlot,
    vaciar,
    guardar,
  }
}