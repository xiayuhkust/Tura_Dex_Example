import { useToast } from '@chakra-ui/react'
import { useCallback } from 'react'

export function useError() {
  const toast = useToast()

  const handleError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    
    toast({
      title: 'Error',
      description: message,
      status: 'error',
      duration: 5000,
      isClosable: true,
    })

    console.error('Error:', error)
  }, [toast])

  return { handleError }
}
