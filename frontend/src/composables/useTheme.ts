import { ref } from 'vue'

const isDark = ref(document.documentElement.classList.contains('dark'))

function apply(v: boolean) {
  isDark.value = v
  document.documentElement.classList.toggle('dark', v)
  try {
    localStorage.setItem('theme', v ? 'dark' : 'light')
  } catch {
    /* sin persistencia si localStorage no está disponible */
  }
}

export function useTheme() {
  return {
    isDark,
    toggle: () => apply(!isDark.value),
  }
}