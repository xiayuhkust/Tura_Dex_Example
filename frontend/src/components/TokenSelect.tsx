import { Box, Button, Input, Text, HStack, VStack, useDisclosure, Image } from '@chakra-ui/react'
import { TokenListModal } from './TokenListModal'

interface Token {
  address: string
  symbol: string
  name: string
  balance?: string
  logoURI?: string
  lastUsed?: number
  price?: string
  priceChange24h?: string
}

export interface TokenSelectProps {
  value: string
  onChange: (value: string) => void
  label: string
  balance?: string
  onTokenSelect?: (token: Token) => void
  selectedToken?: Token
  isDisabled?: boolean
}

export function TokenSelect({ 
  value, 
  onChange, 
  label,
  onTokenSelect,
  selectedToken,
  isDisabled 
}: TokenSelectProps) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Box w="full" p="4" borderRadius="xl" bg="whiteAlpha.100" _hover={{ bg: 'whiteAlpha.200' }}>
        <VStack align="stretch" spacing="2">
          <HStack justify="space-between">
            <Text color="whiteAlpha.600">{label}</Text>
            {selectedToken?.balance && (
              <Text color="whiteAlpha.600">Balance: {selectedToken.balance}</Text>
            )}
          </HStack>
          <HStack>
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="0.0"
              border="none"
              fontSize={{ base: "lg", sm: "xl" }}
              _focus={{ border: 'none' }}
              type="number"
              min="0"
              isDisabled={isDisabled}
            />
            <Button
              variant="outline"
              borderColor="whiteAlpha.400"
              _hover={{ bg: 'whiteAlpha.200' }}
              px="3"
              minW="120px"
              maxW="150px"
              onClick={onOpen}
              isDisabled={isDisabled}
            >
              <HStack>
                {selectedToken && (
                  <Image
                    boxSize="6"
                    borderRadius="full"
                    src={selectedToken.logoURI}
                    fallback={<Box boxSize="6" borderRadius="full" bg="brand.primary" />}
                  />
                )}
                <Text
                  isTruncated
                  maxW="120px"
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="medium"
                >
                  {selectedToken 
                    ? selectedToken.symbol === 'WETH' 
                      ? 'Tura' 
                      : selectedToken.symbol 
                    : 'Select Token'}
                </Text>
              </HStack>
            </Button>
          </HStack>
        </VStack>
      </Box>
      <TokenListModal 
        isOpen={isOpen} 
        onClose={onClose} 
        onSelect={(token) => onTokenSelect?.(token)} 
      />
    </>
  )
}
