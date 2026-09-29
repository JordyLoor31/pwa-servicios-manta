import { ref, onMounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let listenersAttached = false
let deferredPrompt: BeforeInstallPromptEvent | null = null

function esIOS(): boolean {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true
  return Boolean((navigator as Navigator).platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function estaInstalado(): boolean {
  const ipwa = (navigator as Navigator & { standalone?: boolean }).standalone
  if (ipwa) return true
  return window.matchMedia?.('(display-mode: standalone)').matches ?? false
}

export function usePWAInstall() {
  const canInstall = ref(false)
  const isIOS = esIOS()
  const showIosHint = ref(false)

  onMounted(() => {
    if (!listenersAttached) {
      listenersAttached = true

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        deferredPrompt = e as BeforeInstallPromptEvent
        canInstall.value = true
      })

      window.addEventListener('appinstalled', () => {
        deferredPrompt = null
        canInstall.value = false
      })

      window.addEventListener('displaymodechange', () => {
        canInstall.value = !estaInstalado()
      })
    }

    if (esIOS() && !estaInstalado()) {
      canInstall.value = true
    } else if (!esIOS() && !estaInstalado()) {
      canInstall.value = false
    }
  })

  async function promptInstall() {
    if (isIOS) {
      showIosHint.value = true
      return
    }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted' || !deferredPrompt) {
      deferredPrompt = null
      canInstall.value = false
    }
  }

  return { canInstall, isIOS, showIosHint, promptInstall }
}