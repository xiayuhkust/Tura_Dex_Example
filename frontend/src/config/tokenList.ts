import { CONTRACT_ADDRESSES } from './contracts'
import type { Token } from '../hooks/types'

/**
 * Token metadata configuration based on deployment records.
 * All token addresses are verified against deployment_records.md
 */
export const TOKEN_METADATA: Record<string, Omit<Token, 'balance' | 'lastUsed'>> = {
  [CONTRACT_ADDRESSES.WETH]: {
    address: CONTRACT_ADDRESSES.WETH,
    symbol: 'WTURA',
    name: 'Wrapped Tura',
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    price: '1.00',
    priceChange24h: '0.0'
  },
  [CONTRACT_ADDRESSES.TEST_TOKEN_1]: {
    address: CONTRACT_ADDRESSES.TEST_TOKEN_1,
    symbol: 'TT1',
    name: 'Test Token 1',
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    price: '1.00',
    priceChange24h: '0.0'
  },
  [CONTRACT_ADDRESSES.TEST_TOKEN_2]: {
    address: CONTRACT_ADDRESSES.TEST_TOKEN_2,
    symbol: 'TT2',
    name: 'Test Token 2',
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    price: '1.00',
    priceChange24h: '0.0'
  }
}

/**
 * Returns a list of all supported tokens with initialized balances.
 * Used by components that need to display token information.
 */
export const getTokenList = (): Token[] => 
  Object.values(TOKEN_METADATA).map(token => ({
    ...token,
    balance: '0.0'
  }))
