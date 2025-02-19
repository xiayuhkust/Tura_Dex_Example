import { VStack } from '@chakra-ui/react'
import { SwapInterface } from '../components/SwapInterface'

export function SwapPage() {
  return (
    <VStack spacing={4} maxW="container.sm" mx="auto" py={8}>
      <SwapInterface />
    </VStack>
  )
}
