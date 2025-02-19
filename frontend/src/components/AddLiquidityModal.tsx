import { useState, useCallback } from 'react'
import {
  VStack,
  Button,
  Text,
  Divider,
  useToast,
  Box
} from '@chakra-ui/react'
import { TokenSelect } from './TokenSelect'
import { useWeb3 } from '../hooks/useWeb3'
import { useError } from '../hooks/useError'
import type { Token } from '../hooks'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES } from '../config'

export function AddLiquidityModal() {
  const { active, library, account } = useWeb3()
  const [isLoading, setIsLoading] = useState(false)
  const [token0, setToken0] = useState<Token>()
  const [token1, setToken1] = useState<Token>()
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const toast = useToast()
  const { handleError } = useError()

  const handleCreatePool = useCallback(async () => {
    if (!active) {
      handleError(new Error('Please connect your wallet first'))
      return
    }

    if (!token0 || !token1) {
      handleError(new Error('Please select both tokens'))
      return
    }

    if (!amount0 || !amount1) {
      handleError(new Error('Please enter amounts for both tokens'))
      return
    }

    try {
      setIsLoading(true)
      const factoryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.FACTORY,
        [
          'function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)'
        ],
        library.getSigner()
      )

      // Validate token addresses
      if (token0.address === token1.address) {
        throw new Error('Cannot create pool with same token')
      }
      
      // Add token approval
      const token0Contract = new ethers.Contract(
        token0.address,
        [
          'function approve(address spender, uint256 amount) external returns (bool)'
        ],
        library.getSigner()
      )

      const token1Contract = new ethers.Contract(
        token1.address,
        [
          'function approve(address spender, uint256 amount) external returns (bool)'
        ],
        library.getSigner()
      )

      // Approve tokens
      await token0Contract.approve(factoryContract.address, ethers.utils.parseEther(amount0))
      await token1Contract.approve(factoryContract.address, ethers.utils.parseEther(amount1))

      // Create pool
      const fee = 3000 // 0.3%
      await factoryContract.createPool(token0.address, token1.address, fee)

      toast({
        title: 'Pool Created',
        description: 'Liquidity pool has been created successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      toast({
        title: 'Pool Created',
        description: 'Liquidity pool has been created successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }, [active, token0, token1, amount0, amount1, library, account, handleError, toast])

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
