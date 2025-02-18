import { useToast } from '@chakra-ui/react'
import { useCallback } from 'react'

interface ErrorHandlerOptions {
  title?: string
  duration?: number
  isClosable?: boolean
}

export function useError() {
  const toast = useToast()

  const handleError = useCallback((error: unknown, options: ErrorHandlerOptions = {}) => {
    const {
      title = 'Error',
      duration = 5000,
      isClosable = true
    } = options

    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    
    toast({
      title,
      description: message,
      status: 'error',
      duration,
      isClosable,
      position: 'top-right'
    })

    console.error('Error:', error)
  }, [toast])

  return { handleError }
}
