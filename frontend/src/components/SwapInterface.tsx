import { useState, useCallback } from 'react'
import { Box, VStack, Text, Button, HStack, Divider, IconButton, useToast } from '@chakra-ui/react'
import { useWeb3 } from '../hooks/useWeb3'
import { usePriceImpact } from '../hooks/usePriceImpact'
import type { Token } from '../hooks'
import { TokenSelect, TradeDetails, Settings, LoadingSpinner } from './index'
import { useError } from '../hooks'

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
      if (!active) {
        throw new Error('Please connect your wallet first')
      }

      if (!inputToken || !outputToken) {
        throw new Error('Please select tokens')
      }

      if (!inputAmount || !outputAmount) {
        throw new Error('Please enter amounts')
      }

      if (warning?.level === 'error') {
        throw new Error('Price impact too high')
      }

      setIsLoading(true)
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate random errors for testing
      if (Math.random() < 0.3) {
        throw new Error('Network error: Transaction failed')
      }

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
  }, [active, inputToken, outputToken, inputAmount, outputAmount, warning, toast, handleError])

  const { priceImpact, warning } = usePriceImpact(
    inputToken,
    outputToken,
    inputAmount,
    outputAmount
  )
  
  return (
    <Box 
      maxW={{ base: "95%", sm: "md" }} 
      mx="auto" 
      mt={{ base: "4", sm: "10" }} 
      p={{ base: "4", sm: "6" }} 
      borderRadius="xl" 
      bg="brand.surface" 
      boxShadow="xl"
    >
      <VStack spacing={{ base: "4", sm: "6" }}>
        <HStack w="full" justify="space-between">
          <HStack>
            <Text 
              fontSize={{ base: "xl", sm: "2xl" }} 
              fontWeight="bold" 
              bgGradient="linear(to-r, brand.primary, brand.secondary)" 
              bgClip="text"
            >
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
            <Text fontSize={{ base: "xs", sm: "sm" }} color="whiteAlpha.700">
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
                isDisabled={!inputAmount || !outputAmount || warning?.level === 'error'}
                onClick={handleSwap}
              >
                {warning?.level === 'error' ? 'Price Impact Too High' : 'Swap'}
              </Button>
            )}
          </VStack>
        )}
      </VStack>
    </Box>
  )
}
