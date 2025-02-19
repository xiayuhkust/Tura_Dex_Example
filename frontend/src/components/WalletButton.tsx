import { Button, useToast } from '@chakra-ui/react'
import { useWeb3 } from '../hooks/useWeb3'

export function WalletButton() {
  const { active, account, connect } = useWeb3()
  const toast = useToast()

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect wallet',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Button
      onClick={handleConnect}
      bg="brand.primary"
      _hover={{ opacity: 0.9 }}
    >
      {active ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
    </Button>
  )
}
