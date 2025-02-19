import { useState, useCallback } from 'react'
import {
  VStack,
  Button,
  Text,
  Divider,
  useToast,
  Box,
  Select
} from '@chakra-ui/react'
import { TokenSelect } from './TokenSelect'
import { useWeb3 } from '../hooks/useWeb3'
import { useError } from '../hooks/useError'
import type { Token } from '../hooks'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, FEE_TIERS, type FeeTier } from '../config'

interface AddLiquidityModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PoolState {
  fee: FeeTier
  token0Amount: string
  token1Amount: string
  token0: Token | undefined
  token1: Token | undefined
}

export function AddLiquidityModal({ isOpen, onClose }: AddLiquidityModalProps) {
  const { active, library, account } = useWeb3()
  const [isLoading, setIsLoading] = useState(false)
  const [token0, setToken0] = useState<Token>()
  const [token1, setToken1] = useState<Token>()
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const [fee, setFee] = useState<FeeTier>(FEE_TIERS.MEDIUM)
  const toast = useToast()
  const { handleError } = useError()

  const poolState: PoolState = {
    fee,
    token0Amount: amount0,
    token1Amount: amount1,
    token0,
    token1
  }

  const handleCreatePool = useCallback(async () => {
    if (!active || !library || !token0 || !token1 || !amount0 || !amount1) {
      handleError(new Error('Please fill in all fields'))
      return
    }

    if (token0.address === token1.address) {
      handleError(new Error('Cannot create pool with same token'))
      return
    }

    try {
      setIsLoading(true)
      
      // Create pool
      const factoryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.FACTORY,
        ['function createPool(address,address,uint24) external returns (address)'],
        library.getSigner()
      )
      
      const poolAddress = await factoryContract.createPool(token0.address, token1.address, fee)
      console.log('Pool created at:', poolAddress)
      
      // Initialize pool
      const poolContract = new ethers.Contract(
        poolAddress,
        [
          'function initialize(uint160 sqrtPriceX96) external',
          'function mint(address,int24,int24,uint128,bytes) external returns (uint256,uint256)'
        ],
        library.getSigner()
      )
      
      // Calculate initial sqrt price
      const amount0Decimal = ethers.utils.parseUnits(amount0, token0.decimals)
      const amount1Decimal = ethers.utils.parseUnits(amount1, token1.decimals)
      const price = amount1Decimal.mul(ethers.constants.WeiPerEther).div(amount0Decimal)
      const sqrtPriceX96 = ethers.BigNumber.from(
        Math.floor(Math.sqrt(price.toNumber()) * 2**96)
      )
      
      await poolContract.initialize(sqrtPriceX96)
      console.log('Pool initialized with price:', price.toString())
      
      // Approve tokens
      const token0Contract = new ethers.Contract(
        token0.address,
        ['function approve(address,uint256) external returns (bool)'],
        library.getSigner()
      )
      const token1Contract = new ethers.Contract(
        token1.address,
        ['function approve(address,uint256) external returns (bool)'],
        library.getSigner()
      )
      
      await token0Contract.approve(poolAddress, amount0Decimal)
      await token1Contract.approve(poolAddress, amount1Decimal)
      console.log('Tokens approved for pool')
      
      // Add initial liquidity
      const tickSpacing = fee === FEE_TIERS.LOWEST ? 10 : fee === FEE_TIERS.MEDIUM ? 60 : 200
      const tickLower = -887272 // MIN_TICK for maximum range
      const tickUpper = 887272  // MAX_TICK for maximum range
      
      await poolContract.mint(
        account,
        tickLower,
        tickUpper,
        amount0Decimal,
        ethers.utils.defaultAbiCoder.encode(['address'], [account])
      )
      console.log('Initial liquidity added')

      toast({
        title: 'Pool Created',
        description: 'Liquidity pool has been created and initialized successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }, [active, library, token0, token1, amount0, amount1, fee, account, handleError, toast])

  if (!library || !account) {
    return (
      <Box maxW={{ base: "95%", sm: "md" }} mx="auto" mt={{ base: "4", sm: "10" }} p={6} bg="brand.surface" borderRadius="xl">
        <Text color="whiteAlpha.700">Please connect your wallet to create a pool</Text>
      </Box>
    )
  }



  return (
    <Box maxW={{ base: "95%", sm: "md" }} mx="auto" mt={{ base: "4", sm: "10" }} p={6} bg="brand.surface" borderRadius="xl">
      <VStack spacing={4}>
        <Text fontSize="2xl" fontWeight="bold" color="white">Create Liquidity Pool</Text>
        <Text color="whiteAlpha.700" fontSize="sm" w="full">
          Select two tokens and enter the amounts to provide initial liquidity
        </Text>
            
            <VStack w="full" spacing={4}>
              <TokenSelect
                value={amount0}
                onChange={setAmount0}
                label="Token 1"
                selectedToken={token0}
                onTokenSelect={setToken0}
                isDisabled={!active}
              />
              
              <TokenSelect
                value={amount1}
                onChange={setAmount1}
                label="Token 2"
                selectedToken={token1}
                onTokenSelect={setToken1}
                isDisabled={!active}
              />

              <VStack w="full" spacing={2}>
                <Text color="whiteAlpha.700" fontSize="sm" alignSelf="start">
                  Fee Tier
                </Text>
                <Select
                  value={fee}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFee(parseInt(e.target.value) as FeeTier)}
                  bg="whiteAlpha.100"
                  border="none"
                  _focus={{ ring: 1, ringColor: 'brand.primary' }}
                  _hover={{ bg: 'whiteAlpha.200' }}
                >
                  <option value={FEE_TIERS.LOWEST}>0.05% fee (best for stable pairs)</option>
                  <option value={FEE_TIERS.MEDIUM}>0.3% fee (best for most pairs)</option>
                  <option value={FEE_TIERS.HIGHEST}>1% fee (best for exotic pairs)</option>
                </Select>
              </VStack>
            </VStack>

            <Divider borderColor="whiteAlpha.200" />

            <Button
              w="full"
              size="lg"
              bg="brand.primary"
              _hover={{ opacity: 0.9 }}
              isDisabled={!active || !token0 || !token1 || !amount0 || !amount1}
              onClick={handleCreatePool}
              isLoading={isLoading}
            >
              Create Pool
            </Button>
          </VStack>
    </Box>
  )
}
