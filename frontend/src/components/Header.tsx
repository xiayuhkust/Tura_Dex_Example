import { Box, Button, HStack, Text } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { WalletButton } from './WalletButton'

export function Header() {
  const router = useRouter()
  const currentPath = router.pathname

  return (
    <Box as="header" py={4} px={8} bg="brand.surface">
      <HStack justify="space-between">
        <HStack spacing={4}>
          <Button
            variant={currentPath === '/' ? 'solid' : 'ghost'}
            onClick={() => router.push('/')}
            color="whiteAlpha.900"
            _hover={{ bg: 'whiteAlpha.200' }}
          >
            Swap
          </Button>
          <Button
            variant={currentPath === '/liquidity' ? 'solid' : 'ghost'}
            onClick={() => router.push('/liquidity')}
            color="whiteAlpha.900"
            _hover={{ bg: 'whiteAlpha.200' }}
          >
            Liquidity
          </Button>
          <Button
            variant={currentPath === '/pools' ? 'solid' : 'ghost'}
            onClick={() => router.push('/pools')}
            color="whiteAlpha.900"
            _hover={{ bg: 'whiteAlpha.200' }}
          >
            Pools
          </Button>
        </HStack>
        <WalletButton />
      </HStack>
    </Box>
  )
}
