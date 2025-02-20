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
import { formatFeeAmount, formatTokenAmount } from '../utils/numbers'

interface PoolCreatedEventArgs {
  token0: string;
  token1: string;
  fee: number;
  pool: string;
}

interface PoolCreatedEvent {
  args: PoolCreatedEventArgs;
}

interface Pool {
  address: string
  token0: string
  token1: string
  fee: number
  token0Symbol: string
  token1Symbol: string
  liquidity: ethers.BigNumber
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

        // Get token symbols and liquidity
        const erc20Interface = [
          'function symbol() view returns (string)',
          'function name() view returns (string)'
        ]

        const poolInterface = [
          'function liquidity() external view returns (uint128)',
          'function token0() external view returns (address)',
          'function token1() external view returns (address)',
          'function fee() external view returns (uint24)'
        ]

        const poolsData = await Promise.all(events.map(async (event) => {
          const eventData = event as unknown as PoolCreatedEvent;
          const token0Contract = new ethers.Contract(eventData.args.token0, erc20Interface, library)
          const token1Contract = new ethers.Contract(eventData.args.token1, erc20Interface, library)
          const poolContract = new ethers.Contract(eventData.args.pool, poolInterface, library)

          const [token0Symbol, token1Symbol, liquidity] = await Promise.all([
            token0Contract.symbol(),
            token1Contract.symbol(),
            poolContract.liquidity()
          ])

          return {
            address: eventData.args.pool,
            token0: eventData.args.token0,
            token1: eventData.args.token1,
            fee: eventData.args.fee,
            token0Symbol,
            token1Symbol,
            liquidity  // Keep as BigNumber
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
              <Th color="whiteAlpha.700">Liquidity</Th>
            </Tr>
          </Thead>
          <Tbody>
            {pools.map((pool: Pool) => (
              <Tr 
                key={pool.address} 
                _hover={{ bg: 'whiteAlpha.100', cursor: 'pointer' }}
                onClick={() => window.location.pathname = `/pool/${pool.address}`}
              >
                <Td color="whiteAlpha.900">
                  <Text>{`${pool.address.slice(0, 6)}...${pool.address.slice(-4)}`}</Text>
                </Td>
                <Td color="whiteAlpha.900">
                  <Text>{`${pool.token0Symbol}/${pool.token1Symbol}`}</Text>
                </Td>
                <Td color="whiteAlpha.900">
                  <Text>{formatFeeAmount(pool.fee)}</Text>
                </Td>
                <Td color="whiteAlpha.900">
                  <Text>
                    {formatTokenAmount(pool.liquidity, {
                      decimals: 18,
                      symbol: 'LP',
                      address: pool.address,
                      name: `${pool.token0Symbol}/${pool.token1Symbol} LP`
                    })}
                  </Text>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
    </Box>
  )
}
