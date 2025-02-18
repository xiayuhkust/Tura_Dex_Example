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
      background: 'radial-gradient(circle at top left, rgba(255,59,154,0.15), transparent 40%), radial-gradient(circle at top right, rgba(76,130,251,0.15), transparent 40%), radial-gradient(circle at bottom center, rgba(255,184,0,0.1), transparent 30%)',
      primaryButton: 'linear-gradient(45deg, #FF3B9A, #4C82FB)',
      secondaryButton: 'linear-gradient(45deg, #4C82FB, #FFB800)'
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
        fontWeight: 'semibold',
        transition: 'all 0.2s',
        _hover: {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(255, 59, 154, 0.2)'
        },
        _active: {
          transform: 'translateY(0)',
          boxShadow: 'none'
        }
      },
      variants: {
        solid: {
          bg: 'brand.primary',
          color: 'white',
          backgroundImage: 'linear-gradient(45deg, brand.primary, brand.secondary)',
          _hover: {
            opacity: 0.9,
            backgroundImage: 'linear-gradient(45deg, brand.secondary, brand.primary)'
          }
        },
        outline: {
          borderColor: 'whiteAlpha.400',
          color: 'white',
          _hover: {
            bg: 'whiteAlpha.100',
            borderColor: 'brand.primary'
          }
        },
        ghost: {
          color: 'whiteAlpha.900',
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
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid',
        borderColor: 'whiteAlpha.100',
        transition: 'all 0.3s ease',
        _hover: {
          bg: 'brand.surfaceHover',
          borderColor: 'brand.primary',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(255, 59, 154, 0.15)'
        }
      }
    },
    Modal: {
      baseStyle: {
        overlay: {
          bg: 'blackAlpha.800',
          backdropFilter: 'blur(8px)'
        },
        dialog: {
          bg: 'brand.surface',
          borderRadius: 'xl',
          border: '1px solid',
          borderColor: 'whiteAlpha.100',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          backgroundImage: 'gradients.background'
        }
      }
    }
  }
})
