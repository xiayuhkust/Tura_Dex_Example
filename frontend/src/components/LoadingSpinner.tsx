import React from 'react'
import { Spinner, Box, Text, VStack } from '@chakra-ui/react'

interface LoadingSpinnerProps {
  message?: string
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <VStack spacing={4}>
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="whiteAlpha.200"
        color="brand.primary"
        size="xl"
      />
      <Text color="whiteAlpha.800">{message}</Text>
    </VStack>
  )
}
