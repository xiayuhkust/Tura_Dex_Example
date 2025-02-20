import { RemoveLiquidityModal } from '../../components/RemoveLiquidityModal'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  VStack,
  Box,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
} from '@chakra-ui/react'
import { useWeb3 } from '../../hooks/useWeb3'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES } from '../../config'
import { formatFeeAmount, formatTokenAmount } from '../../utils/numbers'
import { AddLiquidityModal } from '../../components/AddLiquidityModal'

interface PoolDetails extends Pool {
  userLiquidity?: ethers.BigNumber
}

export default function PoolDetailPage() {
  const { address } = useParams<{ address: string }>()
  const { library, account } = useWeb3()
  const [pool, setPool] = useState<PoolDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [poolContract, setPoolContract] = useState<ethers.Contract | null>(null)
  const toast = useToast()

  // Cleanup contract listeners
  useEffect(() => {
    return () => {
      if (poolContract) {
        poolContract.removeAllListeners()
      }
    }
  }, [poolContract])

  useEffect(() => {
    const fetchPoolDetails = async () => {
      setIsLoading(true)
      setError(null)
      
      if (!library || !address) {
        setIsLoading(false)
        return
      }

      try {
        // Verify pool address format
        if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
          throw new Error('invalid pool address format')
        }

        const newPoolContract = new ethers.Contract(
          address,
          [
            'function liquidity() external view returns (uint128)',
            'function token0() external view returns (address)',
            'function token1() external view returns (address)',
            'function fee() external view returns (uint24)',
            'function positions(address) external view returns (uint128)'
          ],
          library
        )
        setPoolContract(newPoolContract)

        const erc20Interface = [
          'function symbol() view returns (string)',
          'function name() view returns (string)'
        ]

        // Get token addresses and fee first with error handling
        const [token0, token1, fee] = await Promise.all([
          newPoolContract.token0().catch(() => null),
          newPoolContract.token1().catch(() => null),
          newPoolContract.fee().catch(() => null)
        ])

        // Verify this is a valid pool
        if (!token0 || !token1 || fee === null) {
          throw new Error('invalid pool contract')
        }

        // Verify pool exists in factory
        const factoryContract = new ethers.Contract(
          CONTRACT_ADDRESSES.FACTORY,
          [
            'function getPool(address,address,uint24) external view returns (address)'
          ],
          library
        )

        const poolAddress = await factoryContract.getPool(token0, token1, fee)
        if (poolAddress.toLowerCase() !== address.toLowerCase()) {
          throw new Error('pool not found in factory')
        }

        // Get remaining pool data
        const liquidity = await newPoolContract.liquidity()

        const token0Contract = new ethers.Contract(token0, erc20Interface, library)
        const token1Contract = new ethers.Contract(token1, erc20Interface, library)

        const [token0Symbol, token1Symbol] = await Promise.all([
          token0Contract.symbol().catch(() => 'Unknown'),
          token1Contract.symbol().catch(() => 'Unknown')
        ])

        let userLiquidity = ethers.BigNumber.from(0)
        if (account && newPoolContract) {
          try {
            userLiquidity = await newPoolContract.positions(account)
          } catch (error) {
            console.error('Error fetching user liquidity:', error)
          }
        }

        setPool({
          address,
          token0,
          token1,
          fee,
          token0Symbol,
          token1Symbol,
          liquidity,
          userLiquidity
        })
      } catch (error) {
        console.error('Error fetching pool details:', error)
        const errorMessage = error.message?.toLowerCase() || ''
        let userMessage = 'Failed to load pool details. Please try again.'
        
        if (errorMessage.includes('invalid pool address format')) {
          userMessage = 'Invalid pool address format'
        } else if (errorMessage.includes('invalid pool contract')) {
          userMessage = 'This pool does not exist'
        } else if (errorMessage.includes('pool not found in factory')) {
          userMessage = 'Pool not found in factory'
        }

        setError(userMessage)
        toast({
          title: 'Error',
          description: userMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPoolDetails()
  }, [library, address, account, toast])

  if (isLoading) {
    return (
      <Box maxW="6xl" mx="auto" mt={8} p={6} bg="brand.surface" borderRadius="xl">
        <Text color="whiteAlpha.700">Loading pool details...</Text>
      </Box>
    )
  }

  if (!pool) {
    return (
      <Box maxW="6xl" mx="auto" mt={8} p={6} bg="brand.surface" borderRadius="xl">
        <Text color="whiteAlpha.700">{error || 'Pool not found'}</Text>
      </Box>
    )
  }

  return (
    <Box maxW="6xl" mx="auto" mt={8} p={6} bg="brand.surface" borderRadius="xl">
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" color="white">
          {pool.token0Symbol}/{pool.token1Symbol} Pool
        </Text>
        <Text color="whiteAlpha.700">
          Fee tier: {formatFeeAmount(pool.fee)}
        </Text>

        <Tabs variant="soft-rounded" colorScheme="brand">
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Add Liquidity</Tab>
            <Tab>Remove Liquidity</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Text color="whiteAlpha.900">Total Liquidity</Text>
                <Text fontSize="xl" color="white">
                  {formatTokenAmount(pool.liquidity, {
                    decimals: 18,
                    symbol: 'LP',
                    address: pool.address,
                    name: `${pool.token0Symbol}/${pool.token1Symbol} LP`
                  })}
                </Text>

                {pool.userLiquidity && (
                  <>
                    <Text color="whiteAlpha.900" mt={4}>Your Liquidity</Text>
                    <Text fontSize="xl" color="white">
                      {formatTokenAmount(pool.userLiquidity, {
                        decimals: 18,
                        symbol: 'LP',
                        address: pool.address,
                        name: `${pool.token0Symbol}/${pool.token1Symbol} LP`
                      })}
                    </Text>
                  </>
                )}
              </VStack>
            </TabPanel>

            <TabPanel>
              <AddLiquidityModal />
            </TabPanel>

            <TabPanel>
              <RemoveLiquidityModal
                isOpen={true}
                onClose={() => {}}
                poolAddress={pool.address}
                userLiquidity={pool.userLiquidity || ethers.BigNumber.from(0)}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  )
}
