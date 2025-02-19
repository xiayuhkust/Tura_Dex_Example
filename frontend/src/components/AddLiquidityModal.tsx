import { useState, useCallback, useMemo } from 'react'
import {
  VStack,
  Button,
  Box,
  Text,
  Select,
  useToast,
} from '@chakra-ui/react'
import { TokenSelect } from './TokenSelect'
import { useWeb3 } from '../hooks/useWeb3'
import { useError } from '../hooks/useError'
import type { Token } from '../types/Token'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, FEE_TIERS, type FeeTier } from '../config'
import { parseTokenAmount, formatTokenAmount, formatFeeAmount } from '../utils/numbers'

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
      handleError(new Error('Please connect wallet and select tokens'))
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

    setIsLoading(true)

    try {
      // Check if pool exists
      const factoryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.FACTORY,
        [
          'function getPool(address,address,uint24) external view returns (address)',
          'function createPool(address,address,uint24) external returns (address)',
          'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)'
        ],
        library.getSigner()
      )

      const existingPool = await factoryContract.getPool(token0.address, token1.address, fee)
      if (existingPool !== ethers.constants.AddressZero) {
        handleError(new Error('Pool already exists'))
        return
      }
      
      // Create pool
      const tx = await factoryContract.createPool(token0.address, token1.address, fee)
      const receipt = await tx.wait()
      const poolCreatedEvent = receipt.events?.find((e: { event: string }) => e.event === 'PoolCreated')
      const poolAddress = poolCreatedEvent?.args?.pool
      console.log('Pool created at:', poolAddress)
      
      // Initialize pool with sqrt price
      const poolContract = new ethers.Contract(
        poolAddress,
        [
          'function initialize(uint160) external',
          'function mint(address,int24,int24,uint128,bytes) external returns (uint256,uint256)',
          'function token0() external view returns (address)',
          'function token1() external view returns (address)',
          'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
        ],
        library.getSigner()
      )

      // Initialize with price of 1
      const sqrtPriceX96 = ethers.BigNumber.from('1').shl(96)
      await poolContract.initialize(sqrtPriceX96)
      console.log('Pool initialized with sqrt price:', sqrtPriceX96.toString())
      
      // Convert amounts to BigNumber safely
      const amount0Decimal = parseTokenAmount(amount0, token0)
      const amount1Decimal = parseTokenAmount(amount1, token1)
      
      // Approve tokens with exact amounts
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
      
      const approve0Tx = await token0Contract.approve(poolAddress, amount0Decimal)
      await approve0Tx.wait()
      console.log('Token0 approved:', amount0Decimal.toString())

      const approve1Tx = await token1Contract.approve(poolAddress, amount1Decimal)
      await approve1Tx.wait()
      console.log('Token1 approved:', amount1Decimal.toString())
      
      // Add initial liquidity with calculated tick spacing
      const tickSpacing = useMemo(() => fee === FEE_TIERS.LOWEST ? 10 : fee === FEE_TIERS.MEDIUM ? 60 : 200, [fee]);
      const tickLower = -887272 / tickSpacing * tickSpacing; // MIN_TICK aligned to tick spacing
      const tickUpper = 887272 / tickSpacing * tickSpacing;  // MAX_TICK aligned to tick spacing
      
      const mintTx = await poolContract.mint(
        account,
        tickLower,
        tickUpper,
        amount0Decimal,
        '0x'
      )
      await mintTx.wait()
      console.log('Liquidity added successfully')
      
      toast({
        title: 'Success',
        description: 'Pool created and liquidity added successfully',
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
        } else if (txError.code === 'NUMERIC_FAULT') {
          handleError(new Error('Numeric error occurred. Please check token amounts.'))
        } else {
          handleError(error)
        }
      } else {
        handleError(error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [active, library, account, token0, token1, amount0, amount1, fee, handleError, toast])

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
      <VStack spacing={6}>
        <Box w="full">
          <VStack spacing={4} align="stretch">
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

              <Box>
                <Text color="whiteAlpha.600" mb={2}>
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
                  <option value={FEE_TIERS.LOWEST}>{formatFeeAmount(FEE_TIERS.LOWEST)}</option>
                  <option value={FEE_TIERS.LOW}>{formatFeeAmount(FEE_TIERS.LOW)}</option>
                  <option value={FEE_TIERS.MEDIUM}>{formatFeeAmount(FEE_TIERS.MEDIUM)}</option>
                </Select>
              </Box>
            </VStack>
          </Box>

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
