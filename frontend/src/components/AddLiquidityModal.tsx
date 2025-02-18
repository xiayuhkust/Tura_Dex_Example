import { useState, useCallback } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Button,
  Text,
  Divider,
  useToast
} from '@chakra-ui/react'
import { TokenSelect } from './TokenSelect'
import { useWeb3 } from '../hooks/useWeb3'
import { useError } from '../hooks/useError'
import type { Token } from '../hooks'

interface AddLiquidityModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddLiquidityModal({ isOpen, onClose }: AddLiquidityModalProps) {
  const { active, library, account } = useWeb3()
  const [token0, setToken0] = useState<Token>()
  const [token1, setToken1] = useState<Token>()
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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
      // Implement pool creation using UniswapV3Factory
      const factoryContract = new library.eth.Contract(
        ['function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)'],
        '0x1F98431c8aD98523631AE4a59f267346ea31F984' // UniswapV3Factory address
      )

      // Validate token addresses
      if (token0.address === token1.address) {
        throw new Error('Cannot create pool with same token')
      }
      
      const fee = 3000 // 0.3%
      await factoryContract.methods.createPool(token0.address, token1.address, fee).send({ from: account })

      toast({
        title: 'Pool Created',
        description: 'Liquidity pool has been created successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      onClose()
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }, [active, token0, token1, amount0, amount1, library, account, handleError, toast, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="brand.surface" borderRadius="xl">
        <ModalHeader color="white">Create Liquidity Pool</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          <VStack spacing={4}>
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
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
