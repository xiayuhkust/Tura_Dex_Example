import { useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  VStack,
  HStack,
  Text,
  Box
} from '@chakra-ui/react'

interface Token {
  address: string
  symbol: string
  name: string
  balance?: string
}

const DEMO_TOKENS: Token[] = [
  {
    address: '0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be',
    symbol: 'WETH',
    name: 'Wrapped ETH',
    balance: '0.0'
  },
  {
    address: '0xf7430841c1917Fee24B04dBbd0b809F36E5Ad716',
    symbol: 'TT1',
    name: 'Test Token 1',
    balance: '0.0'
  },
  {
    address: '0x3Cbc85319E3D9d6b29DDe06f591017e9f9666652',
    symbol: 'TT2',
    name: 'Test Token 2',
    balance: '0.0'
  }
]

interface TokenListModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (token: Token) => void
}

export function TokenListModal({ isOpen, onClose, onSelect }: TokenListModalProps) {
  const [search, setSearch] = useState('')
  const filteredTokens = DEMO_TOKENS.filter(token => 
    token.symbol.toLowerCase().includes(search.toLowerCase()) ||
    token.name.toLowerCase().includes(search.toLowerCase()) ||
    token.address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="brand.surface" borderRadius="xl">
        <ModalHeader color="white">Select Token</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <Input
              placeholder="Search by name or address"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              bg="whiteAlpha.100"
              border="none"
              _focus={{ border: 'none', ring: 1, ringColor: 'brand.primary' }}
            />
            <VStack w="full" align="stretch" spacing={2}>
              {filteredTokens.map(token => (
                <Box
                  key={token.address}
                  p={3}
                  borderRadius="lg"
                  bg="whiteAlpha.100"
                  cursor="pointer"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => {
                    onSelect(token)
                    onClose()
                  }}
                >
                  <HStack justify="space-between">
                    <HStack>
                      <Box boxSize="8" borderRadius="full" bg="brand.primary" />
                      <VStack align="start" spacing={0}>
                        <Text color="white" fontWeight="bold">{token.symbol}</Text>
                        <Text color="whiteAlpha.700" fontSize="sm">{token.name}</Text>
                      </VStack>
                    </HStack>
                    <Text color="whiteAlpha.900">{token.balance}</Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
