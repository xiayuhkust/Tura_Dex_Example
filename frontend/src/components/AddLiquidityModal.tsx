import { useState, useCallback, useMemo } from 'react'
import {
  VStack,
  Button,
  Box,
  Text,
  Select,
  useToast,
  type UseToastOptions,
  type StackProps
} from '@chakra-ui/react'
import { TokenSelect } from './TokenSelect'
import { useWeb3 } from '../hooks/useWeb3'
import { useError } from '../hooks/useError'
import type { Token } from '../types/Token'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, FEE_TIERS, type FeeTier } from '../config'
import { parseTokenAmount, formatFeeAmount } from '../utils/numbers'
import { TickMath } from '../utils/TickMath'
import { LiquidityAmounts } from '../utils/LiquidityAmounts'
import IUniswapV3PoolABI from '../abis/IUniswapV3Pool.json'

interface AddLiquidityModalProps extends StackProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AddLiquidityModal({ isOpen, onClose, ...stackProps }: AddLiquidityModalProps) {
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

  const handleAddLiquidity = useCallback(async () => {
    if (!active || !library || !token0 || !token1 || !amount0 || !amount1) {
      handleError(new Error('Please connect wallet and select tokens'))
      return
    }

    if (!ethers.utils.isAddress(token0.address) || !ethers.utils.isAddress(token1.address)) {
      handleError(new Error('Invalid token addresses'))
      return
    }

    setIsLoading(true)

    try {
      // Convert amounts to BigNumber safely
      const amount0Decimal = parseTokenAmount(amount0)
      const amount1Decimal = parseTokenAmount(amount1)
      
      // Get pool address
      const factoryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.FACTORY,
        [
          'function getPool(address,address,uint24) external view returns (address)'
        ],
        library.getSigner()
      )

      const poolAddress = await factoryContract.getPool(token0.address, token1.address, fee)
      if (poolAddress === ethers.constants.AddressZero) {
        handleError(new Error('Pool does not exist'))
        return
      }

      // Get pool contract with complete interface
      const poolContract = new ethers.Contract(
        poolAddress,
        IUniswapV3PoolABI.abi,
        library.getSigner()
      )

      // Get current price and token order from pool
      try {
        const { sqrtPriceX96 } = await poolContract.slot0()
        // Verify pool price is valid
        if (sqrtPriceX96.eq(0)) {
          handleError(new Error('Pool price is invalid'))
          return
        }

        // Verify token order matches pool
        const poolToken0 = await poolContract.token0()
        const poolToken1 = await poolContract.token1()
        if (token0.address.toLowerCase() !== poolToken0.toLowerCase() || 
            token1.address.toLowerCase() !== poolToken1.toLowerCase()) {
          handleError(new Error('Token order does not match pool. Please swap token positions.'))
          return
        }
      } catch (error) {
        handleError(new Error('Failed to get pool price. Please check if the pool exists.'))
        return
      }

      // Calculate tick range for concentrated liquidity
      const tickSpacing = fee === FEE_TIERS.LOWEST ? 10 : fee === FEE_TIERS.MEDIUM ? 60 : 200;
      const tickLower = -tickSpacing;
      const tickUpper = tickSpacing;

      // Get current price and calculate liquidity amount
      const { sqrtPriceX96 } = await poolContract.slot0();
      const sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(tickLower);
      const sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(tickUpper);
      const liquidity = LiquidityAmounts.getLiquidityForAmounts(
        ethers.BigNumber.from(sqrtPriceX96.toString()),
        ethers.BigNumber.from(sqrtRatioAX96.toString()),
        ethers.BigNumber.from(sqrtRatioBX96.toString()),
        amount0Decimal,
        amount1Decimal
      );

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

      const approve0Tx = await token0Contract.approve(poolAddress, amount0Decimal)
      await approve0Tx.wait()
      console.log('Token0 approved:', amount0Decimal.toString())

      const approve1Tx = await token1Contract.approve(poolAddress, amount1Decimal)
      await approve1Tx.wait()
      console.log('Token1 approved:', amount1Decimal.toString())

      // Encode mint callback data with pool key
      const poolKey = {
        token0: token0.address,
        token1: token1.address,
        fee: fee
      }
      const encodedData = ethers.utils.defaultAbiCoder.encode(
        ['(address token0, address token1, uint24 fee)', 'address'],
        [poolKey, account]
      )

      // Check initial balances
      const token0Balance = await token0Contract.balanceOf(account)
      const token1Balance = await token1Contract.balanceOf(account)
      console.log('Initial balances:', {
        token0: ethers.utils.formatUnits(token0Balance, token0.decimals),
        token1: ethers.utils.formatUnits(token1Balance, token1.decimals)
      })

      // Add liquidity through pool contract
      const tx = await poolContract.mint(
        account!,  // Non-null assertion is safe because we check for account in the guard above
        tickLower,
        tickUpper,
        liquidity,
        encodedData,
        { gasLimit: 5000000 }
      )
      const receipt = await tx.wait()
      
      // Verify final balances
      const finalToken0Balance = await token0Contract.balanceOf(account)
      const finalToken1Balance = await token1Contract.balanceOf(account)
      console.log('Final balances:', {
        token0: ethers.utils.formatUnits(finalToken0Balance, token0.decimals),
        token1: ethers.utils.formatUnits(finalToken1Balance, token1.decimals)
      })
      
      // Verify tokens were deducted
      const token0Deducted = token0Balance.sub(finalToken0Balance)
      const token1Deducted = token1Balance.sub(finalToken1Balance)
      if (token0Deducted.isZero() || token1Deducted.isZero()) {
        throw new Error('Token deduction failed - no tokens were transferred')
      }
      
      console.log('Liquidity added successfully:', {
        transactionHash: receipt.transactionHash,
        token0Deducted: ethers.utils.formatUnits(token0Deducted, token0.decimals),
        token1Deducted: ethers.utils.formatUnits(token1Deducted, token1.decimals)
      })

      const toastOptions: UseToastOptions = {
        title: 'Success',
        description: 'Liquidity added successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      };
      toast(toastOptions)
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const txError = error as { code: string; message?: string }
        if (txError.code === 'UNPREDICTABLE_GAS_LIMIT') {
          handleError(new Error('Failed to add liquidity. Please check token amounts and approvals.'))
        } else if (txError.code === 'CALL_EXCEPTION') {
          handleError(new Error('Failed to add liquidity. The pool may be at capacity or the tick range is invalid.'))
        } else if (txError.message?.includes('ERC20: insufficient allowance')) {
          handleError(new Error('Token approval required. Please approve spending of tokens first.'))
        } else if (txError.message?.includes('ERC20: transfer amount exceeds balance')) {
          handleError(new Error('Insufficient token balance. Please check your wallet balance.'))
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
      <VStack spacing={6} {...stackProps}>
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
                  data-testid="fee-tier-select"
                  value={fee}
                  onChange={(e) => setFee(parseInt(e.target.value) as FeeTier)}
                  bg="whiteAlpha.100"
                  border="none"
                  _focus={{ ring: 1, ringColor: 'brand.primary' }}
                  _hover={{ bg: 'whiteAlpha.200' }}
                >
                  <option value={FEE_TIERS.LOWEST}>{formatFeeAmount(FEE_TIERS.LOWEST)}</option>
                  <option value={FEE_TIERS.MEDIUM}>{formatFeeAmount(FEE_TIERS.MEDIUM)}</option>
                  <option value={FEE_TIERS.HIGHEST}>{formatFeeAmount(FEE_TIERS.HIGHEST)}</option>
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
            onClick={handleAddLiquidity}
            isLoading={isLoading}
          >
            Add Liquidity
          </Button>
        </VStack>
      </Box>
  )
}
