import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'

const pacific = {
  '50': '#e8f4f8',
  '100': '#c5e5ee',
  '200': '#96d0e0',
  '300': '#5fb3cb',
  '400': '#2e94b2',
  '500': '#0f7da0',
  '600': '#006d8f',
  '700': '#005c78',
  '800': '#07495f',
  '900': '#0a3a4b',
  '950': '#052733',
}

const ctaOrange = {
  '50': '#fef4ea',
  '100': '#fde6cd',
  '200': '#fbca9b',
  '300': '#f9ac63',
  '400': '#f49038',
  '500': '#f28c28',
  '600': '#d96f14',
  '700': '#b45311',
  '800': '#8f4012',
  '900': '#743612',
  '950': '#401c07',
}

const surface = {
  '0': '#ffffff',
  '50': '#f7f9fa',
  '100': '#eef2f4',
  '200': '#dfe5e8',
  '300': '#cbd4da',
  '400': '#a9b6bf',
  '500': '#8897a2',
  '600': '#667781',
  '700': '#4c5b66',
  '800': '#33414b',
  '900': '#172a35',
  '950': '#0d1b23',
}

const turquoise = {
  '50': '#e4fafa',
  '100': '#bef1f1',
  '200': '#8ee5e5',
  '300': '#52d4d4',
  '400': '#1fc2c2',
  '500': '#00a6a6',
  '600': '#008c8c',
  '700': '#067070',
  '800': '#0a5858',
  '900': '#0b4848',
  '950': '#032c2c',
}

const warnButton = {
  background: '{orange.500}',
  hoverBackground: '{orange.600}',
  activeBackground: '{orange.700}',
  borderColor: '{orange.500}',
  hoverBorderColor: '{orange.600}',
  activeBorderColor: '{orange.700}',
  color: '#ffffff',
  hoverColor: '#ffffff',
  activeColor: '#ffffff',
}

const secondaryButton = {
  background: '{teal.500}',
  hoverBackground: '{teal.600}',
  activeBackground: '{teal.700}',
  borderColor: '{teal.500}',
  hoverBorderColor: '{teal.600}',
  activeBorderColor: '{teal.700}',
  color: '#ffffff',
  hoverColor: '#ffffff',
  activeColor: '#ffffff',
}

const outlinedSecondaryButton = {
  hoverBackground: '{teal.50}',
  activeBackground: '{teal.100}',
  borderColor: '{teal.500}',
  color: '{teal.600}',
}

export const MantaPreset = definePreset(Aura, {
  primitive: {
    orange: ctaOrange,
    teal: turquoise,
  },
  semantic: {
    primary: {
      ...pacific,
      color: '{primary.600}',
      contrastColor: '#ffffff',
      hoverColor: '{primary.700}',
      activeColor: '{primary.800}',
    },
    surface,
    formField: {
      focusBorderColor: '{teal.500}',
      floatLabelFocusColor: '{teal.600}',
      focusRing: {
        color: '{teal.300}',
      },
    },
  },
  components: {
    drawer: {
      root: {
        background: '{surface.0}',
        color: '{surface.800}',
      },
    },
    button: {
      root: {
        warn: warnButton,
        secondary: secondaryButton,
      },
      outlined: {
        secondary: outlinedSecondaryButton,
      },
    },
  },
})