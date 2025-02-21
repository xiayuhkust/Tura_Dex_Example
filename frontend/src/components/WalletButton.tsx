import { Button } from '@chakra-ui/react'
import { useWeb3 } from '../hooks/useWeb3'

export function WalletButton() {
  const { active, account, connect } = useWeb3()

  if (!active) {
    return (
      <Button
        onClick={connect}
        bg="brand.primary"
        _hover={{ opacity: 0.9 }}
      >
        Connect Wallet
      </Button>
    )
  }

  return (
    <Button
      bg="whiteAlpha.200"
      _hover={{ bg: 'whiteAlpha.300' }}
    >
      {account?.slice(0, 6)}...{account?.slice(-4)}
    </Button>
  )
}
