import React from 'react'
import {
  VStack,
  HStack,
  Text,
  Box,
  Collapse,
  useDisclosure,
  Button,
  Icon,
  Divider
} from '@chakra-ui/react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Token {
  address: string
  symbol: string
  name: string
  balance?: string
  price?: string
}

interface TradeDetailsProps {
  inputToken?: Token
  outputToken?: Token
  inputAmount: string
  outputAmount: string
  priceImpact: number
  warning?: {
    level: 'info' | 'warning' | 'error'
    message: string
  } | null
  slippageTolerance: number
  estimatedGas?: string
}

export function TradeDetails({
  inputToken,
  outputToken,
  inputAmount,
  outputAmount,
  priceImpact,
  warning,
  slippageTolerance,
  estimatedGas
}: TradeDetailsProps) {
  const { isOpen, onToggle } = useDisclosure()

  const getWarningColor = (level?: 'info' | 'warning' | 'error') => {
    switch (level) {
      case 'error':
        return 'red.400'
      case 'warning':
        return 'orange.400'
      case 'info':
        return 'blue.400'
      default:
        return 'whiteAlpha.900'
    }
  }

  const exchangeRate = inputAmount && outputAmount && inputToken && outputToken
    ? `1 ${inputToken.symbol} = ${(parseFloat(outputAmount) / parseFloat(inputAmount)).toFixed(6)} ${outputToken.symbol}`
    : '-'

  const minimumReceived = outputAmount && slippageTolerance
    ? (parseFloat(outputAmount) * (1 - slippageTolerance / 100)).toFixed(6)
    : '-'

  return (
    <Box w="full">
      <Button
        variant="ghost"
        w="full"
        h="auto"
        py={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        onClick={onToggle}
        _hover={{ bg: 'whiteAlpha.100' }}
      >
        <HStack>
          <Text color="whiteAlpha.900">Trade Details</Text>
          {warning && (
            <Text color={getWarningColor(warning.level)} fontSize="sm">
              ({warning.message})
            </Text>
          )}
        </HStack>
        <Icon as={isOpen ? ChevronUp : ChevronDown} color="whiteAlpha.600" />
      </Button>

      <Collapse in={isOpen}>
        <VStack
          spacing={3}
          align="stretch"
          px={4}
          py={3}
          bg="whiteAlpha.50"
          borderRadius="xl"
          mt={2}
        >
          <HStack justify="space-between">
            <Text color="whiteAlpha.600">Exchange Rate</Text>
            <Text color="whiteAlpha.900">{exchangeRate}</Text>
          </HStack>

          <HStack justify="space-between">
            <Text color="whiteAlpha.600">Price Impact</Text>
            <Text color={getWarningColor(warning?.level)}>
              {priceImpact.toFixed(2)}%
            </Text>
          </HStack>

          <HStack justify="space-between">
            <Text color="whiteAlpha.600">Minimum Received</Text>
            <Text color="whiteAlpha.900">
              {minimumReceived} {outputToken?.symbol}
            </Text>
          </HStack>

          {estimatedGas && (
            <HStack justify="space-between">
              <Text color="whiteAlpha.600">Network Fee</Text>
              <Text color="whiteAlpha.900">{estimatedGas}</Text>
            </HStack>
          )}

          <Divider borderColor="whiteAlpha.200" />

          <Box>
            <Text color="whiteAlpha.600" fontSize="sm">
              Output is estimated. You will receive at least {minimumReceived} {outputToken?.symbol} or the transaction will revert.
            </Text>
          </Box>
        </VStack>
      </Collapse>
    </Box>
  )
}
