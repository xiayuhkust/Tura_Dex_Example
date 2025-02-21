import { Box, Button, HStack } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { WalletButton } from './WalletButton'

export function Header() {
  const navigate = useNavigate()
  const currentPath = window.location.pathname

  return (
    <Box as="header" py={4} px={8} bg="brand.surface">
      <HStack justify="space-between">
        <HStack spacing={4}>
          <Button
            variant={currentPath === '/' ? 'solid' : 'ghost'}
            onClick={() => navigate('/')}
            color="whiteAlpha.900"
            _hover={{ bg: 'whiteAlpha.200' }}
          >
            Swap
          </Button>
          <Button
            variant={currentPath === '/liquidity' ? 'solid' : 'ghost'}
            onClick={() => navigate('/liquidity')}
            color="whiteAlpha.900"
            _hover={{ bg: 'whiteAlpha.200' }}
          >
            Liquidity
          </Button>
          <Button
            variant={currentPath === '/pools' ? 'solid' : 'ghost'}
            onClick={() => navigate('/pools')}
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
