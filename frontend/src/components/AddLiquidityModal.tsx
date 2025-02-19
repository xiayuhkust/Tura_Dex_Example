import { useState, useCallback, useMemo } from 'react'
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
import type { Token } from '../types/Token'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, FEE_TIERS, type FeeTier } from '../config'

export function AddLiquidityModal() {
  const { active, library, account, connect } = useWeb3()
  const [isLoading, setIsLoading] = useState(false)
  const [token0, setToken0] = useState<Token | undefined>()
  const [token1, setToken1] = useState<Token | undefined>()
  
  const handleToken0Select = (token: Token) => setToken0(token)
  const handleToken1Select = (token: Token) => setToken1(token)
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const [fee, setFee] = useState<FeeTier>(FEE_TIERS.MEDIUM)
  const toast = useToast()
  const { handleError } = useError()

  const handleConnect = useCallback(async () => {
    try {
      await connect()
    } catch (error) {
      handleError(error)
    }
  }, [connect, handleError])

  // Validate pool creation parameters
  const isValidPool = useMemo(() => {
    if (!token0 || !token1 || !amount0 || !amount1) return false;
    if (token0.address === token1.address) return false;
    return true;
  }, [token0, token1, amount0, amount1]);

  // Disable create button if pool is invalid
  const isCreateDisabled = !active || !isValidPool;

  const handleCreatePool = useCallback(async () => {
    if (!active || !library || !token0 || !token1 || !amount0 || !amount1) {
      handleError(new Error('Please fill in all fields'))
      return
    }

    if (!ethers.utils.isAddress(token0.address) || !ethers.utils.isAddress(token1.address)) {
      handleError(new Error('Invalid token addresses'))
      return
    }

    if (token0.address.toLowerCase() === token1.address.toLowerCase()) {
      handleError(new Error('Cannot create pool with the same token'))
      return
    }

    if (token0.address === token1.address) {
      handleError(new Error('Cannot create pool with same token'))
      return
    }

    if (!ethers.utils.isAddress(token0.address) || !ethers.utils.isAddress(token1.address)) {
      handleError(new Error('Invalid token addresses'))
      return
    }

    try {
      setIsLoading(true)
      
      // Create pool
      const factoryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.FACTORY,
        [
          'function createPool(address,address,uint24) external returns (address)',
          'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)'
        ],
        library.getSigner()
      )
      
      const tx = await factoryContract.createPool(token0.address, token1.address, fee)
      const receipt = await tx.wait()
      const poolCreatedEvent = receipt.events?.find((e: { event: string }) => e.event === 'PoolCreated')
      const poolAddress = poolCreatedEvent?.args?.pool
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
      
      // Add initial liquidity with calculated tick spacing
      const tickSpacing = useMemo(() => fee === FEE_TIERS.LOWEST ? 10 : fee === FEE_TIERS.MEDIUM ? 60 : 200, [fee]);
      const tickLower = -887272 / tickSpacing * tickSpacing; // MIN_TICK aligned to tick spacing
      const tickUpper = 887272 / tickSpacing * tickSpacing;  // MAX_TICK aligned to tick spacing
      
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
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        // Handle specific contract errors
        const txError = error as { code: string; message?: string; reason?: string }
        if (txError.code === 'CALL_EXCEPTION') {
          handleError(new Error('Pool creation failed. The pool may already exist or the tokens/fee are invalid.'))
        } else if (txError.code === 'UNPREDICTABLE_GAS_LIMIT') {
          handleError(new Error('Failed to estimate gas. The pool may already exist.'))
        } else {
          handleError(error)
        }
      } else {
        handleError(error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [active, library, token0, token1, amount0, amount1, fee, account, handleError, toast])

  if (!library || !account) {
    return (
      <Box maxW={{ base: "95%", sm: "md" }} mx="auto" mt={{ base: "4", sm: "10" }} p={6} bg="brand.surface" borderRadius="xl">
        <VStack spacing={4}>
          <Text color="whiteAlpha.700">Please connect your wallet to create a pool</Text>
          <Button
            w="full"
            size="lg"
            bg="brand.primary"
            _hover={{ opacity: 0.9 }}
            onClick={handleConnect}
          >
            Connect Wallet
          </Button>
        </VStack>
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
                onTokenSelect={handleToken0Select}
                isDisabled={!active}
              />
              
              <TokenSelect
                value={amount1}
                onChange={setAmount1}
                label="Token 2"
                selectedToken={token1}
                onTokenSelect={handleToken1Select}
                isDisabled={!active}
              />

              <VStack w="full" spacing={2}>
                <Text color="whiteAlpha.700" fontSize="sm" alignSelf="start">
                  Fee Tier
                </Text>
                <Select
                  value={fee}
                  onChange={(e: { target: { value: string } }) => setFee(parseInt(e.target.value) as FeeTier)}
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
              isDisabled={isCreateDisabled}
              onClick={handleCreatePool}
              isLoading={isLoading}
            >
              Create Pool
            </Button>
          </VStack>
    </Box>
  )
}
