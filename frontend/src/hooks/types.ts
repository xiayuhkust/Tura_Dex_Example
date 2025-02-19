export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  balance?: string
  logoURI?: string
  lastUsed?: number
  price?: string
  priceChange24h?: string
}
