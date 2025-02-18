import { useState, useMemo } from 'react'
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
  Box,
  Image
} from '@chakra-ui/react'
import { useTokenBalances } from '../hooks/useTokenBalances'
import { useRecentTokens } from '../hooks/useRecentTokens'
import type { Token } from '../hooks/types'

const DEMO_TOKENS: Token[] = [
  {
    address: '0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be',
    symbol: 'WETH',
    name: 'Wrapped ETH',
    balance: '0.0',
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    price: '2,500.00',
    priceChange24h: '+2.5'
  },
  {
    address: '0xf7430841c1917Fee24B04dBbd0b809F36E5Ad716',
    symbol: 'TT1',
    name: 'Test Token 1',
    balance: '0.0',
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    price: '1.00',
    priceChange24h: '0.0'
  },
  {
    address: '0x3Cbc85319E3D9d6b29DDe06f591017e9f9666652',
    symbol: 'TT2',
    name: 'Test Token 2',
    balance: '0.0',
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    price: '1.00',
    priceChange24h: '0.0'
  }
]

interface TokenListModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (token: Token) => void
}

export function TokenListModal({ isOpen, onClose, onSelect }: TokenListModalProps) {
  const [search, setSearch] = useState('')
  const { recentTokens, addRecentToken } = useRecentTokens()
  
  const balances = useTokenBalances(DEMO_TOKENS.map(t => t.address))
  
  const tokensWithBalances = useMemo(() => 
    DEMO_TOKENS.map(token => ({
      ...token,
      balance: balances[token.address] || '0.0'
    }))
  , [balances])
  
  const filteredTokens = useMemo(() => {
    const searchLower = search.toLowerCase()
    const filtered = tokensWithBalances.filter(token => 
      token.symbol.toLowerCase().includes(searchLower) ||
      token.name.toLowerCase().includes(searchLower) ||
      token.address.toLowerCase().includes(searchLower)
    )
    
    // Sort by balance (descending) and then by name
    return filtered.sort((a, b) => {
      const balanceA = parseFloat(a.balance || '0')
      const balanceB = parseFloat(b.balance || '0')
      if (balanceA !== balanceB) return balanceB - balanceA
      return a.name.localeCompare(b.name)
    })
  }, [tokensWithBalances, search])

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
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
            <VStack w="full" align="stretch" spacing={4} maxH="60vh" overflowY="auto">
              {recentTokens.length > 0 && (
                <Box>
                  <Text color="whiteAlpha.600" mb={2}>Recently Used</Text>
                  <VStack align="stretch" spacing={2}>
                    {recentTokens.map((token: Token) => (
                      <Box
                        key={token.address}
                        p={3}
                        borderRadius="lg"
                        bg="whiteAlpha.100"
                        cursor="pointer"
                        _hover={{ bg: 'whiteAlpha.200' }}
                        onClick={() => {
                          const updatedToken = { ...token, lastUsed: Date.now() }
                          onSelect(updatedToken)
                          addRecentToken(updatedToken)
                          onClose()
                        }}
                      >
                        <HStack justify="space-between">
                          <HStack spacing={3}>
                            <Image
                              boxSize="8"
                              borderRadius="full"
                              src={token.logoURI}
                              fallback={<Box boxSize="8" borderRadius="full" bg="brand.primary" />}
                            />
                            <VStack align="start" spacing={0}>
                              <Text color="white" fontWeight="bold">{token.symbol}</Text>
                              <Text color="whiteAlpha.700" fontSize="sm">{token.name}</Text>
                            </VStack>
                          </HStack>
                          <VStack align="end" spacing={0}>
                            <Text color="whiteAlpha.900">{token.balance}</Text>
                            <HStack spacing={1}>
                              <Text color="whiteAlpha.700" fontSize="sm">${token.price}</Text>
                              <Text 
                                color={parseFloat(token.priceChange24h || '0') >= 0 ? 'green.400' : 'red.400'} 
                                fontSize="sm"
                              >
                                {token.priceChange24h}%
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
              
              <Box>
                <Text color="whiteAlpha.600" mb={2}>All Tokens</Text>
                <VStack align="stretch" spacing={2}>
                  {filteredTokens.map((token: Token) => (
                    <Box
                      key={token.address}
                      p={3}
                      borderRadius="lg"
                      bg="whiteAlpha.100"
                      cursor="pointer"
                      _hover={{ bg: 'whiteAlpha.200' }}
                      onClick={() => {
                        const updatedToken = { ...token, lastUsed: Date.now() }
                        onSelect(updatedToken)
                        addRecentToken(updatedToken)
                        onClose()
                      }}
                    >
                      <HStack justify="space-between">
                        <HStack spacing={3}>
                          <Image
                            boxSize="8"
                            borderRadius="full"
                            src={token.logoURI}
                            fallback={<Box boxSize="8" borderRadius="full" bg="brand.primary" />}
                          />
                          <VStack align="start" spacing={0}>
                            <Text color="white" fontWeight="bold">{token.symbol}</Text>
                            <Text color="whiteAlpha.700" fontSize="sm">{token.name}</Text>
                          </VStack>
                        </HStack>
                        <VStack align="end" spacing={0}>
                          <Text color="whiteAlpha.900">{token.balance}</Text>
                          <HStack spacing={1}>
                            <Text color="whiteAlpha.700" fontSize="sm">${token.price}</Text>
                            <Text 
                              color={parseFloat(token.priceChange24h || '0') >= 0 ? 'green.400' : 'red.400'} 
                              fontSize="sm"
                            >
                              {token.priceChange24h}%
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
