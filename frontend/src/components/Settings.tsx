import { useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Box,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Input,
  Button,
  useDisclosure
} from '@chakra-ui/react'
import { Settings as SettingsIcon } from 'lucide-react'

interface SettingsProps {
  slippageTolerance: number
  onSlippageToleranceChange: (value: number) => void
  transactionDeadline: number
  onTransactionDeadlineChange: (value: number) => void
}

export function Settings({
  slippageTolerance,
  onSlippageToleranceChange,
  transactionDeadline,
  onTransactionDeadlineChange
}: SettingsProps) {
  // Use transaction deadline in custom deadline input
  const formattedDeadline = transactionDeadline.toString()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [customSlippage, setCustomSlippage] = useState('')
  const [customDeadline, setCustomDeadline] = useState('')

  const handleSlippageChange = (value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
      onSlippageToleranceChange(numValue)
      setCustomSlippage(value)
    }
  }

  const handleDeadlineChange = (value: string) => {
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue > 0 && numValue <= 4320) {
      onTransactionDeadlineChange(numValue)
      setCustomDeadline(value)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        color="whiteAlpha.700"
        _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
        onClick={onOpen}
      >
        <SettingsIcon size={20} />
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="brand.surface" borderRadius="xl">
          <ModalHeader color="white">Transaction Settings</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              <Box>
                <Text color="white" fontWeight="semibold" mb={2}>
                  Slippage Tolerance
                </Text>
                <HStack spacing={2} mb={3}>
                  <Button
                    size="sm"
                    variant={slippageTolerance === 0.1 ? 'solid' : 'outline'}
                    onClick={() => onSlippageToleranceChange(0.1)}
                  >
                    0.1%
                  </Button>
                  <Button
                    size="sm"
                    variant={slippageTolerance === 0.5 ? 'solid' : 'outline'}
                    onClick={() => onSlippageToleranceChange(0.5)}
                  >
                    0.5%
                  </Button>
                  <Button
                    size="sm"
                    variant={slippageTolerance === 1.0 ? 'solid' : 'outline'}
                    onClick={() => onSlippageToleranceChange(1.0)}
                  >
                    1.0%
                  </Button>
                  <Input
                    size="sm"
                    placeholder="Custom"
                    value={customSlippage}
                    onChange={(e) => handleSlippageChange(e.target.value)}
                    w="80px"
                  />
                </HStack>
                <Slider
                  aria-label="slippage-tolerance"
                  value={slippageTolerance}
                  onChange={onSlippageToleranceChange}
                  min={0.1}
                  max={5}
                  step={0.1}
                >
                  <SliderTrack bg="whiteAlpha.200">
                    <SliderFilledTrack bg="brand.primary" />
                  </SliderTrack>
                  <SliderThumb boxSize={4} />
                </Slider>
              </Box>

              <Box>
                <Text color="white" fontWeight="semibold" mb={2}>
                  Transaction Deadline
                </Text>
                <HStack spacing={2}>
                  <Input
                    size="sm"
                    placeholder="Minutes"
                    value={customDeadline || formattedDeadline}
                    onChange={(e) => handleDeadlineChange(e.target.value)}
                    w="80px"
                  />
                  <Text color="whiteAlpha.700">minutes</Text>
                </HStack>
              </Box>

              <Box>
                <Text color="white" fontWeight="semibold" mb={2}>
                  Interface Settings
                </Text>
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text color="whiteAlpha.700">Auto Router</Text>
                    <Button size="sm" variant="outline">
                      ON
                    </Button>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="whiteAlpha.700">Expert Mode</Text>
                    <Button size="sm" variant="outline">
                      OFF
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
