import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Divider,
  useColorModeValue
} from '@chakra-ui/react'
import { LoadingSpinner } from './LoadingSpinner'
import type { Token } from '../hooks'

interface TransactionConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  inputToken?: Token
  outputToken?: Token
  inputAmount: string
  outputAmount: string
  priceImpact: number
  warning?: {
    level: 'error' | 'warning' | 'info'
    message: string
  } | null
  slippageTolerance: number
  estimatedGas?: string
  isConfirming?: boolean
}

export function TransactionConfirmation({
  isOpen,
  onClose,
  onConfirm,
  inputToken,
  outputToken,
  inputAmount,
  outputAmount,
  priceImpact,
  warning,
  slippageTolerance,
  estimatedGas,
  isConfirming = false
}: TransactionConfirmationProps) {
  const warningBg = useColorModeValue(
    warning?.level === 'error' ? 'red.50' : warning?.level === 'warning' ? 'orange.50' : 'blue.50',
    warning?.level === 'error' ? 'red.900' : warning?.level === 'warning' ? 'orange.900' : 'blue.900'
  )

  const warningColor = useColorModeValue(
    warning?.level === 'error' ? 'red.500' : warning?.level === 'warning' ? 'orange.500' : 'blue.500',
    warning?.level === 'error' ? 'red.200' : warning?.level === 'warning' ? 'orange.200' : 'blue.200'
  )

  const minimumReceived = outputAmount && slippageTolerance
    ? (parseFloat(outputAmount) * (1 - slippageTolerance / 100)).toFixed(6)
    : '-'

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="brand.surface" borderRadius="xl">
        <ModalHeader color="white">Confirm Swap</ModalHeader>
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text color="whiteAlpha.600">You Pay</Text>
              <HStack>
                <Text color="white">{inputAmount}</Text>
                <Text color="whiteAlpha.800">{inputToken?.symbol}</Text>
              </HStack>
            </HStack>

            <HStack justify="space-between">
              <Text color="whiteAlpha.600">You Receive</Text>
              <HStack>
                <Text color="white">{outputAmount}</Text>
                <Text color="whiteAlpha.800">{outputToken?.symbol}</Text>
              </HStack>
            </HStack>

            {warning && (
              <Box p={3} bg={warningBg} borderRadius="md">
                <Text color={warningColor} fontWeight="medium">
                  {warning.message}
                </Text>
              </Box>
            )}

            <Divider borderColor="whiteAlpha.200" />

            <VStack spacing={2} align="stretch">
              <HStack justify="space-between">
                <Text color="whiteAlpha.600">Price Impact</Text>
                <Text color={warningColor}>{priceImpact.toFixed(2)}%</Text>
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
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          {isConfirming ? (
            <LoadingSpinner size="md" message="Confirming..." />
          ) : (
            <HStack spacing={4} w="full">
              <Button
                variant="outline"
                onClick={onClose}
                flex={1}
                _hover={{ bg: 'whiteAlpha.100' }}
              >
                Cancel
              </Button>
              <Button
                bg="brand.primary"
                onClick={onConfirm}
                flex={1}
                _hover={{ opacity: 0.9 }}
                isDisabled={warning?.level === 'error'}
              >
                Confirm Swap
              </Button>
            </HStack>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
