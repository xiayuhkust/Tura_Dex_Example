export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  balance?: string;
  logoURI?: string;
  lastUsed?: number;
  price?: string;
  priceChange24h?: string;
}
