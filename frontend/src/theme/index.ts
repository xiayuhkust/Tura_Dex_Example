import { extendTheme } from '@chakra-ui/react'

export const theme = extendTheme({
  colors: {
    brand: {
      primary: '#FF3B9A',     // Vibrant pink for CTAs
      secondary: '#4C82FB',   // Bright blue for secondary actions
      accent: '#FFB800',      // Golden yellow for highlights
      success: '#16A34A',     // Green for positive actions
      error: '#DC2626',       // Red for errors
      background: '#0D0E0E',  // Rich black background
      surface: '#191B1B',     // Slightly lighter surface
      surfaceHover: '#2D3131' // Hover state for surface elements
    },
    gradients: {
      background: 'radial-gradient(circle at top left, rgba(255,59,154,0.1), transparent 40%), radial-gradient(circle at top right, rgba(76,130,251,0.1), transparent 40%)',
    }
  },
  styles: {
    global: {
      'html, body': {
        bg: 'brand.background',
        color: 'white',
        minHeight: '100vh',
        backgroundImage: 'gradients.background'
      },
      'button:hover': {
        transform: 'scale(1.02)',
        transition: 'transform 0.2s'
      }
    }
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'xl',
        fontWeight: 'semibold'
      },
      variants: {
        solid: {
          bg: 'brand.primary',
          color: 'white',
          _hover: {
            bg: 'brand.primary',
            opacity: 0.9
          }
        },
        outline: {
          borderColor: 'brand.primary',
          color: 'brand.primary',
          _hover: {
            bg: 'whiteAlpha.100'
          }
        }
      }
    },
    Card: {
      baseStyle: {
        bg: 'brand.surface',
        borderRadius: 'xl',
        p: 4,
        boxShadow: 'lg',
        _hover: {
          bg: 'brand.surfaceHover',
          transition: 'background 0.2s'
        }
      }
    }
  }
})
