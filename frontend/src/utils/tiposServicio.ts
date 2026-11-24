const opcionesGenerales = ['Instalación', 'Reparación', 'Mantenimiento', 'Diagnóstico', 'Otro']

const grupos: Array<{ palabras: string[]; opciones: string[] }> = [
  {
    palabras: ['aire', 'climatización', 'climatizacion'],
    opciones: ['Instalación', 'Mantenimiento preventivo', 'Reparación', 'Recarga de gas', 'Limpieza'],
  },
  {
    palabras: ['plomer', 'fontaner'],
    opciones: ['Reparación de fugas', 'Destape de tuberías', 'Instalación', 'Mantenimiento'],
  },
  {
    palabras: ['electric'],
    opciones: ['Instalación', 'Reparación', 'Mantenimiento', 'Diagnóstico'],
  },
  {
    palabras: ['limpieza', 'aseo'],
    opciones: ['Limpieza regular', 'Limpieza profunda', 'Limpieza post obra', 'Desinfección'],
  },
  {
    palabras: ['pintura'],
    opciones: ['Pintura interior', 'Pintura exterior', 'Reparación de paredes', 'Mantenimiento'],
  },
  {
    palabras: ['jardiner', 'jardín', 'jardin'],
    opciones: ['Mantenimiento', 'Poda', 'Diseño de jardín', 'Instalación de riego'],
  },
  {
    palabras: ['carpinter'],
    opciones: ['Fabricación', 'Reparación', 'Instalación', 'Restauración'],
  },
  {
    palabras: ['cerrajer'],
    opciones: ['Apertura de puerta', 'Cambio de cerradura', 'Instalación', 'Reparación'],
  },
  {
    palabras: ['electrodomést', 'electrodomest'],
    opciones: ['Diagnóstico', 'Reparación', 'Mantenimiento', 'Instalación'],
  },
]

export function tiposServicioParaCategoria(nombre: string): string[] {
  const normalizado = nombre.toLocaleLowerCase()
  return grupos.find((grupo) => grupo.palabras.some((palabra) => normalizado.includes(palabra)))?.opciones ??
    opcionesGenerales
}
