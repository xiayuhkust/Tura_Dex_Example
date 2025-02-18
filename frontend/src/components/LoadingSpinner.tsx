import { Spinner, Text, VStack, Box } from '@chakra-ui/react'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function LoadingSpinner({ message = 'Loading...', size = 'xl' }: LoadingSpinnerProps) {
  return (
    <Box p={4} textAlign="center">
      <VStack spacing={4}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="whiteAlpha.200"
          color="brand.primary"
          size={size}
        />
        <Text color="whiteAlpha.800">{message}</Text>
      </VStack>
    </Box>
  )
}
