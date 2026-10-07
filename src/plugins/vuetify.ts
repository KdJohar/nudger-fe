import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const brandColors = {
  primary: '#FF6B4A',
  secondary: '#4338CA',
  primaryHover: '#4338CA',
  secondaryHover: '#4338CA',
}

export const vuetify = createVuetify({
  components,
  directives,
  defaults: {
    VBtn: {
      rounded: 'lg',
      elevation: 0,
    },
    VCard: {
      rounded: 'xl',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: brandColors.primary,
          secondary: brandColors.secondary,
          background: '#FFFFFF',
          surface: '#FFFFFF',
          'surface-variant': '#F0F1F6',
          'on-background': '#1B1D26',
          'on-surface': '#1B1D26',
          'on-surface-variant': '#666A78',
          success: '#15803D',
          warning: '#B45309',
          error: '#C2413C',
          info: '#2563EB',
        },
        variables: {
          'border-color': '#E4E6EE',
          'high-emphasis-opacity': 0.9,
          'medium-emphasis-opacity': 0.68,
          'idle-opacity': 0.06,
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: brandColors.primary,
          secondary: brandColors.secondary,
          background: '#171B25',
          surface: '#171B25',
          'surface-variant': '#222735',
          'on-background': '#F5F7FB',
          'on-surface': '#F5F7FB',
          'on-surface-variant': '#A8ADBC',
          success: '#4ADE80',
          warning: '#FBBF24',
          error: '#FB7185',
          info: '#60A5FA',
        },
        variables: {
          'border-color': '#2A3040',
          'high-emphasis-opacity': 0.96,
          'medium-emphasis-opacity': 0.72,
          'idle-opacity': 0.1,
        },
      },
    },
  },
})
