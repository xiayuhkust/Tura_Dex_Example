import type { Token } from '../hooks'
import { CONTRACT_ADDRESSES } from '../config'

export const DEMO_TOKENS: Token[] = [
  {
    address: CONTRACT_ADDRESSES.WETH,
    symbol: 'WTURA',
    name: 'Wrapped Tura',
    decimals: 18,
    balance: '0.0',
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    price: '1.00',
    priceChange24h: '0.0'
  },
  {
    address: CONTRACT_ADDRESSES.TEST_TOKEN_1,
    symbol: 'TT1',
    name: 'Test Token 1',
    decimals: 18,
    balance: '0.0',
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    price: '1.00',
    priceChange24h: '0.0'
  },
  {
    address: CONTRACT_ADDRESSES.TEST_TOKEN_2,
    symbol: 'TT2',
    name: 'Test Token 2',
    decimals: 18,
    balance: '0.0',
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    price: '1.00',
    priceChange24h: '0.0'
  }
]
