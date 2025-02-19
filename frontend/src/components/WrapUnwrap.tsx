import { useState } from 'react'
import {
  VStack,
  HStack,
  Button,
  Text,
  Input,
  useToast,
  Box,
  Divider
} from '@chakra-ui/react'
import { useWeb3 } from '../hooks/useWeb3'
import { useError } from '../hooks/useError'
import { ethers } from 'ethers'

export function WrapUnwrap() {
  const [amount, setAmount] = useState('')
  const [isWrapping, setIsWrapping] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { active, library } = useWeb3()
  const toast = useToast()
  const { handleError } = useError()

  const handleAction = async () => {
    if (!amount || !active) return
    
    setIsLoading(true)
    try {
      const weth = new ethers.Contract(
        import.meta.env.VITE_WETH_ADDRESS,
        ['function deposit()', 'function withdraw(uint)'],
        library.getSigner()
      )
      
      if (isWrapping) {
        await weth.deposit({
          value: ethers.utils.parseEther(amount)
        })
      } else {
        await weth.withdraw(
          ethers.utils.parseEther(amount)
        )
      }
      
      toast({
        title: `${isWrapping ? 'Wrap' : 'Unwrap'} Successful`,
        description: `${amount} ${isWrapping ? 'Tura → WTURA' : 'WTURA → Tura'}`,
        status: 'success',
        duration: 5000,
      })
      setAmount('')
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box w="full" bg="brand.surface" p={6} borderRadius="xl">
      <VStack spacing={4}>
        <HStack w="full" justify="space-between">
          <Text fontSize="xl" fontWeight="bold" color="white">
            {isWrapping ? 'Wrap Tura' : 'Unwrap WTURA'}
          </Text>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsWrapping(!isWrapping)}
            color="brand.primary"
          >
            {isWrapping ? 'Switch to Unwrap' : 'Switch to Wrap'}
          </Button>
        </HStack>
        
        <Divider borderColor="whiteAlpha.200" />
        
        <VStack w="full" spacing={2}>
          <Text color="whiteAlpha.700" fontSize="sm" alignSelf="start">
            Amount
          </Text>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            type="number"
            min="0"
            bg="whiteAlpha.100"
            border="none"
            _focus={{ ring: 1, ringColor: 'brand.primary' }}
            _hover={{ bg: 'whiteAlpha.200' }}
            fontSize="lg"
          />
        </VStack>
        
        <Button
          w="full"
          size="lg"
          isLoading={isLoading}
          onClick={handleAction}
          isDisabled={!active || !amount}
          bg="brand.primary"
          _hover={{ opacity: 0.9 }}
        >
          {isWrapping ? 'Wrap' : 'Unwrap'}
        </Button>
      </VStack>
    </Box>
  )
}
