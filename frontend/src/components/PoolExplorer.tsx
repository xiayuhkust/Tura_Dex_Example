import { useState, useEffect } from 'react'
import {
  VStack,
  Box,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
} from '@chakra-ui/react'
import { useWeb3 } from '../hooks/useWeb3'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES } from '../config'
import { formatFeeAmount } from '../utils/numbers'

interface Pool {
  address: string
  token0: string
  token1: string
  fee: number
  token0Symbol: string
  token1Symbol: string
}

export function PoolExplorer() {
  const { library } = useWeb3()
  const [pools, setPools] = useState<Pool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const fetchPools = async () => {
      if (!library) return

      try {
        const factoryContract = new ethers.Contract(
          CONTRACT_ADDRESSES.FACTORY,
          [
            'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)',
            'function getPool(address,address,uint24) external view returns (address)'
          ],
          library
        )

        // Get all PoolCreated events
        const filter = factoryContract.filters.PoolCreated()
        const events = await factoryContract.queryFilter(filter)

        // Get token symbols
        const erc20Interface = [
          'function symbol() view returns (string)',
          'function name() view returns (string)'
        ]

        const poolsData = await Promise.all(events.map(async (event) => {
          const token0Contract = new ethers.Contract(event.args.token0, erc20Interface, library)
          const token1Contract = new ethers.Contract(event.args.token1, erc20Interface, library)

          const [token0Symbol, token1Symbol] = await Promise.all([
            token0Contract.symbol(),
            token1Contract.symbol()
          ])

          return {
            address: event.args.pool,
            token0: event.args.token0,
            token1: event.args.token1,
            fee: event.args.fee,
            token0Symbol,
            token1Symbol
          }
        }))

        setPools(poolsData)
      } catch (error) {
        console.error('Error fetching pools:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch pools',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPools()
  }, [library, toast])

  if (isLoading) {
    return (
      <Box maxW="6xl" mx="auto" mt={8} p={6} bg="brand.surface" borderRadius="xl">
        <Text color="whiteAlpha.700">Loading pools...</Text>
      </Box>
    )
  }

  return (
    <Box maxW="6xl" mx="auto" mt={8} p={6} bg="brand.surface" borderRadius="xl">
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" color="white">
          All Pools
        </Text>

        <Table variant="simple">
          <Thead>
            <Tr>
              <Th color="whiteAlpha.700">Pool</Th>
              <Th color="whiteAlpha.700">Tokens</Th>
              <Th color="whiteAlpha.700">Fee</Th>
            </Tr>
          </Thead>
          <Tbody>
            {pools.map((pool) => (
              <Tr key={pool.address} _hover={{ bg: 'whiteAlpha.100' }}>
                <Td color="whiteAlpha.900">
                  <Text>{`${pool.address.slice(0, 6)}...${pool.address.slice(-4)}`}</Text>
                </Td>
                <Td color="whiteAlpha.900">
                  <Text>{`${pool.token0Symbol}/${pool.token1Symbol}`}</Text>
                </Td>
                <Td color="whiteAlpha.900">
                  <Text>{formatFeeAmount(pool.fee)}</Text>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
    </Box>
  )
}
