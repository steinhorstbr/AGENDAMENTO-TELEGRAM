/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        // Cores personalizadas para o BJJ
        bjj: {
          primary: '#6366F1',
          secondary: '#8B5CF6',
          accent: '#F59E0B',
          success: '#10B981',
          warning: '#F97316',
          danger: '#EF4444',
          dark: '#1F2937',
          light: '#F9FAFB'
        },
        // Cores para diferentes tipos de treino
        training: {
          kids: '#F59E0B',
          beginner: '#3B82F6',
          advanced: '#EF4444',
          private: '#8B5CF6',
          sparring: '#DC2626',
          technique: '#059669'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft': 'bounce 2s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(10px)' 
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)' 
          }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      },
      gridTemplateColumns: {
        'schedule': 'auto 1fr',
        'week': 'repeat(7, minmax(0, 1fr))'
      },
      screens: {
        'xs': '475px'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class'
    }),
    // Plugin customizado para utilitários específicos do projeto
    function({ addUtilities, theme, addComponents }) {
      const newUtilities = {
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: theme('colors.gray.100')
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme('colors.gray.400'),
            borderRadius: '3px'
          }
        }
      }
      
      const newComponents = {
        '.btn-primary': {
          backgroundColor: theme('colors.bjj.primary'),
          color: theme('colors.white'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.medium'),
          fontSize: theme('fontSize.sm'),
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: theme('colors.indigo.500'),
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.md')
          },
          '&:active': {
            transform: 'translateY(0)'
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
            '&:hover': {
              transform: 'none',
              backgroundColor: theme('colors.bjj.primary')
            }
          }
        },
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          padding: theme('spacing.6'),
          boxShadow: theme('boxShadow.soft'),
          border: `1px solid ${theme('colors.gray.200')}`
        },
        '.schedule-hour-line': {
          borderTop: `1px solid ${theme('colors.gray.100')}`,
          position: 'absolute',
          left: '0',
          right: '0',
          height: '0.5px'
        }
      }

      addUtilities(newUtilities)
      addComponents(newComponents)
    }
  ]
}