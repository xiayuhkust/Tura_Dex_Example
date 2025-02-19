import { Box } from '@chakra-ui/react'
import { PoolExplorer } from '../components/PoolExplorer'

export default function PoolsPage() {
  return (
    <Box minH="100vh" bg="brand.background">
      <PoolExplorer />
    </Box>
  )
}
