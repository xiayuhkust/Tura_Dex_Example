import { Box, VStack } from '@chakra-ui/react'
import { SwapInterface } from '../components/SwapInterface'
import { WrapUnwrap } from '../components/WrapUnwrap'

export function SwapPage() {
  return (
    <VStack spacing={4} maxW="container.sm" mx="auto" py={8}>
      <WrapUnwrap />
      <SwapInterface />
    </VStack>
  )
}
