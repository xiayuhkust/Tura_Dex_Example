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
import type { Token } from '../hooks'

import { DEMO_TOKENS } from '../utils/tokens'

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
