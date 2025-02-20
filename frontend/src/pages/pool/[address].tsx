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
  const toast = useToast()

  useEffect(() => {
    const fetchPoolDetails = async () => {
      if (!library || !address) return

      try {
        // Verify pool exists first
        const factoryContract = new ethers.Contract(
          CONTRACT_ADDRESSES.FACTORY,
          [
            'function getPool(address,address,uint24) external view returns (address)'
          ],
          library
        )

        const poolContract = new ethers.Contract(
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

        // Get token addresses and fee first
        const [token0, token1, fee] = await Promise.all([
          poolContract.token0().catch(() => null),
          poolContract.token1().catch(() => null),
          poolContract.fee().catch(() => null)
        ])

        // Verify this is a valid pool
        if (!token0 || !token1 || fee === null) {
          throw new Error('Invalid pool address')
        }

        // Verify pool exists in factory
        const poolAddress = await factoryContract.getPool(token0, token1, fee)
        if (poolAddress.toLowerCase() !== address.toLowerCase()) {
          throw new Error('Pool not found in factory')
        }

        const erc20Interface = [
          'function symbol() view returns (string)',
          'function name() view returns (string)'
        ]

        // Get remaining pool data
        const [token0Symbol, token1Symbol, liquidity] = await Promise.all([
          new ethers.Contract(token0, erc20Interface, library).symbol(),
          new ethers.Contract(token1, erc20Interface, library).symbol(),
          poolContract.liquidity()
        ])

        const token0Contract = new ethers.Contract(token0, erc20Interface, library)
        const token1Contract = new ethers.Contract(token1, erc20Interface, library)

        const [token0Symbol, token1Symbol] = await Promise.all([
          token0Contract.symbol(),
          token1Contract.symbol()
        ])

        let userLiquidity
        if (account) {
          userLiquidity = await poolContract.positions(account)
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
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch pool details',
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
        <Text color="whiteAlpha.700">Pool not found</Text>
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
