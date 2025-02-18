import { Box, Button, Text, VStack } from '@chakra-ui/react'

interface NetworkErrorToastProps {
  onClose: () => void
  networkName: string
  chainId: number
  rpcUrl: string
}

export function NetworkErrorToast({ onClose, networkName, chainId, rpcUrl }: NetworkErrorToastProps) {
  return (
    <Box p={3} bg="orange.700" borderRadius="md">
      <VStack align="start" spacing={2}>
        <Text fontWeight="bold">Add {networkName}</Text>
        <Text>Please add the following network to your wallet:</Text>
        <Box bg="whiteAlpha.200" p={2} borderRadius="md" w="full">
          <VStack align="start" spacing={1}>
            <Text><Text as="span" fontWeight="bold">Network Name:</Text> {networkName}</Text>
            <Text><Text as="span" fontWeight="bold">Chain ID:</Text> {chainId}</Text>
            <Text><Text as="span" fontWeight="bold">RPC URL:</Text> {rpcUrl}</Text>
          </VStack>
        </Box>
        <Button
          size="sm"
          colorScheme="orange"
          onClick={onClose}
        >
          Got it
        </Button>
      </VStack>
    </Box>
  )
}
