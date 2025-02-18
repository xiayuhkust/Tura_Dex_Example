import { useState, useCallback } from 'react'
import { Box, VStack, Text, Button, HStack, Divider, IconButton, useToast } from '@chakra-ui/react'
import { useWeb3 } from '../hooks/useWeb3'
import { usePriceImpact } from '../hooks/usePriceImpact'
import type { Token } from '../hooks'
import { TokenSelect, TradeDetails, Settings, LoadingSpinner, useError } from './index'

export function SwapInterface() {
  const { active, account, connect } = useWeb3()
  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount, setOutputAmount] = useState('')
  const [slippageTolerance, setSlippageTolerance] = useState(0.5)
  const [transactionDeadline, setTransactionDeadline] = useState(20)
  const [inputToken, setInputToken] = useState<Token>()
  const [outputToken, setOutputToken] = useState<Token>()
  const [estimatedGas] = useState<string>('~0.0001 ETH')
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const { handleError } = useError()

  const handleSwap = useCallback(async () => {
    try {
      setIsLoading(true)
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast({
        title: 'Swap successful',
        description: 'Your transaction has been confirmed',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }, [toast, handleError])

  const { priceImpact, warning } = usePriceImpact(
    inputToken,
    outputToken,
    inputAmount,
    outputAmount
  )
  
  return (
    <Box maxW="md" mx="auto" mt="10" p="6" borderRadius="xl" bg="brand.surface" boxShadow="xl">
      <VStack spacing="6">
        <HStack w="full" justify="space-between">
          <HStack>
            <Text fontSize="2xl" fontWeight="bold" bgGradient="linear(to-r, brand.primary, brand.secondary)" bgClip="text">
              AgentSwap
            </Text>
            <Settings
              slippageTolerance={slippageTolerance}
              onSlippageToleranceChange={setSlippageTolerance}
              transactionDeadline={transactionDeadline}
              onTransactionDeadlineChange={setTransactionDeadline}
            />
          </HStack>
          {active && (
            <Text fontSize="sm" color="whiteAlpha.700">
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </Text>
          )}
        </HStack>

        {!active ? (
          <Button 
            onClick={connect} 
            w="full" 
            bg="brand.primary" 
            _hover={{ opacity: 0.9 }}
            size="lg"
          >
            Connect Wallet
          </Button>
        ) : (
          <VStack w="full" spacing="4">
            <TokenSelect
              value={inputAmount}
              onChange={setInputAmount}
              label="You Pay"
              selectedToken={inputToken}
              onTokenSelect={setInputToken}
            />
            
            <IconButton
              aria-label="Switch tokens"
              icon={<Text>↓</Text>}
              variant="ghost"
              color="brand.primary"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={() => {
                const tempToken = inputToken
                setInputToken(outputToken)
                setOutputToken(tempToken)
                const tempAmount = inputAmount
                setInputAmount(outputAmount)
                setOutputAmount(tempAmount)
              }}
            />
            
            <TokenSelect
              value={outputAmount}
              onChange={setOutputAmount}
              label="You Receive"
              selectedToken={outputToken}
              onTokenSelect={setOutputToken}
            />

            <Divider borderColor="whiteAlpha.200" />

            <TradeDetails
              inputToken={inputToken}
              outputToken={outputToken}
              inputAmount={inputAmount}
              outputAmount={outputAmount}
              priceImpact={priceImpact}
              warning={warning}
              slippageTolerance={slippageTolerance}
              estimatedGas={estimatedGas}
            />

            {isLoading ? (
              <LoadingSpinner message="Preparing swap..." />
            ) : (
              <Button
                w="full"
                size="lg"
                bg="brand.primary"
                _hover={{ opacity: 0.9 }}
                isDisabled={!inputAmount || !outputAmount}
                onClick={handleSwap}
              >
                Swap
              </Button>
            )}
          </VStack>
        )}
      </VStack>
    </Box>
  )
}
