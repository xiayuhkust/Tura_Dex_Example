import { useState } from 'react'
import { Box, VStack, Text, Button, HStack, Divider, IconButton } from '@chakra-ui/react'
import { useWeb3 } from '../hooks/useWeb3'
import { TokenSelect } from './TokenSelect'
import { TradeDetails } from './TradeDetails'
import { Settings } from './Settings'
import { usePriceImpact, Token } from '../hooks/usePriceImpact'

export function SwapInterface() {
  const { active, account, connect } = useWeb3()
  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount, setOutputAmount] = useState('')
  const [slippageTolerance, setSlippageTolerance] = useState(0.5)
  const [transactionDeadline, setTransactionDeadline] = useState(20)
  const [inputToken, setInputToken] = useState<Token>()
  const [outputToken, setOutputToken] = useState<Token>()
  const [estimatedGas] = useState<string>('~0.0001 ETH')

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

            <Button
              w="full"
              size="lg"
              bg="brand.primary"
              _hover={{ opacity: 0.9 }}
              isDisabled={!inputAmount || !outputAmount}
            >
              Swap
            </Button>
          </VStack>
        )}
      </VStack>
    </Box>
  )
}
