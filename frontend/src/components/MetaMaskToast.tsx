import { Box, Button, Text, VStack } from '@chakra-ui/react'

interface MetaMaskToastProps {
  onClose: () => void
}

export function MetaMaskToast({ onClose }: MetaMaskToastProps) {
  return (
    <Box p={3} bg="orange.700" borderRadius="md">
      <VStack align="start" spacing={2}>
        <Text fontWeight="bold">MetaMask Required</Text>
        <Text>Please install MetaMask to connect your wallet.</Text>
        <Button
          as="a"
          href="https://metamask.io"
          target="_blank"
          size="sm"
          colorScheme="orange"
        >
          Install MetaMask
        </Button>
      </VStack>
    </Box>
  )
}
