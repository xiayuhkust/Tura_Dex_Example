// No React import needed for modern React
import { HStack, Button, Box } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'

export function NavigationBar() {
  const location = useLocation()
  
  return (
    <Box w="full" bg="brand.surface" py={4}>
      <HStack spacing={4} maxW={{ base: "95%", sm: "md" }} mx="auto">
        <Button
          as={Link}
          to="/"
          variant={location.pathname === '/' ? 'solid' : 'ghost'}
          color="brand.primary"
          size="sm"
        >
          Swap
        </Button>
        <Button
          as={Link}
          to="/liquidity"
          variant={location.pathname === '/liquidity' ? 'solid' : 'ghost'}
          color="brand.primary"
          size="sm"
        >
          Liquidity
        </Button>
        <Button
          as={Link}
          to="/pools"
          variant={location.pathname === '/pools' ? 'solid' : 'ghost'}
          color="brand.primary"
          size="sm"
        >
          Pools
        </Button>
      </HStack>
    </Box>
  )
}
