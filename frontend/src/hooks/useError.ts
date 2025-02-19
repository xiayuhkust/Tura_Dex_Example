import { useToast } from '@chakra-ui/react'
import { useCallback } from 'react'

export function useError() {
  const toast = useToast()

  const handleError = useCallback((error: unknown) => {
    let message = 'An unexpected error occurred'
    
    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'object' && error !== null) {
      // Handle transaction errors
      const txError = error as { code?: string; message?: string; reason?: string; data?: any }
      if (txError.code === 'CALL_EXCEPTION') {
        message = txError.data?.message || 'Transaction failed. The pool may already exist or parameters are invalid.'
      } else if (txError.code === 'UNPREDICTABLE_GAS_LIMIT') {
        message = 'Failed to estimate gas. The pool may already exist.'
      } else if (txError.code === 'ACTION_REJECTED') {
        message = 'Transaction was rejected by user.'
      } else if (txError.code === 'INVALID_ARGUMENT') {
        message = 'Invalid arguments provided to contract method.'
      } else if (txError.reason) {
        message = txError.reason
      } else if (txError.message) {
        message = txError.message
      }
    }
    
    toast({
      title: 'Error',
      description: message,
      status: 'error',
      duration: 5000,
      isClosable: true,
    })

    console.error('Error details:', JSON.stringify(error, null, 2))
  }, [toast])

  return { handleError }
}
