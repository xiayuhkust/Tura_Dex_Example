import type { Token } from '../hooks'

export const DEMO_TOKENS: Token[] = [
  {
    address: '0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be',
    symbol: 'Tura',
    name: 'Wrapped ETH (Tura)',
    balance: '0.0',
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    price: '2,500.00',
    priceChange24h: '+2.5'
  },
  {
    address: import.meta.env.VITE_TT1_ADDRESS,
    symbol: 'TT1',
    name: 'Test Token 1',
    balance: '0.0',
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    price: '1.00',
    priceChange24h: '0.0'
  },
  {
    address: import.meta.env.VITE_TT2_ADDRESS,
    symbol: 'TT2',
    name: 'Test Token 2',
    balance: '0.0',
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    price: '1.00',
    priceChange24h: '0.0'
  }
]
