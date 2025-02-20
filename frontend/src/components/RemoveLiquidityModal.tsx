import { useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  VStack,
  Button,
} from '@chakra-ui/react'
import { ethers } from 'ethers'

interface RemoveLiquidityModalProps {
  isOpen: boolean
  onClose: () => void
  poolAddress: string
  userLiquidity: ethers.BigNumber
}

export function RemoveLiquidityModal({ isOpen, onClose, poolAddress, userLiquidity }: RemoveLiquidityModalProps) {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemoveLiquidity = async () => {
    // TODO: Implement remove liquidity functionality
    setIsRemoving(true)
    try {
      console.log(`Removing ${userLiquidity.toString()} liquidity from pool ${poolAddress}`)
      // Implementation coming soon
    } catch (error) {
      console.error('Error removing liquidity:', error)
    } finally {
      setIsRemoving(false)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg="brand.surface">
        <ModalHeader color="white">Remove Liquidity</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          <VStack spacing={4} align="stretch" pb={6}>
            <Text color="whiteAlpha.900">
              Coming soon: Remove liquidity functionality
            </Text>
            <Button
              colorScheme="brand"
              isLoading={isRemoving}
              onClick={handleRemoveLiquidity}
              isDisabled={true}
            >
              Remove Liquidity
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
