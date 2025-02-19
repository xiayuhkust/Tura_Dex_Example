import React from 'react'
import { Box, VStack } from '@chakra-ui/react'
import { AddLiquidityModal } from '../components/AddLiquidityModal'

export function LiquidityPage() {
  return (
    <Box maxW={{ base: "95%", sm: "md" }} mx="auto" mt={{ base: "4", sm: "10" }}>
      <AddLiquidityModal />
    </Box>
  )
}
