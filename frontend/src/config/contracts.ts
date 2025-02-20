/**
 * Contract addresses and constants for the Tura DEX.
 * All addresses are verified against deployment_records.md
 */
import type { BigNumber } from 'ethers'

const addressRegex = /^0x[a-fA-F0-9]{40}$/

/**
 * Standard Uniswap V3 fee tiers
 * Values are in hundredths of a bip (0.0001%)
 */
export const FEE_TIERS = {
  LOWEST: 500,    // 0.05% - Best for stable pairs
  MEDIUM: 3000,   // 0.3%  - Best for most pairs
  HIGHEST: 10000  // 1%    - Best for exotic pairs
} as const

export type FeeTier = typeof FEE_TIERS[keyof typeof FEE_TIERS]

export const CONTRACT_ADDRESSES = {
  // Core contracts
  WETH: '0xc8F7d7989a409472945b00177396f4e9b8601DF3',  // Updated and verified TuraWETH
  FACTORY: '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d',  // Updated V3 Factory with proper event emission
  ROUTER: '0xB492Bf5FBfA79364149CC76B77b8bd78BecD1416',
  POSITION_MANAGER: '0x6Ba55510435288424053d8924450Bb1269fD3BD2',  // NonfungiblePositionManager for LP token management
  
  // Test tokens
  TEST_TOKEN_1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
  TEST_TOKEN_2: '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122',
} as const

// Validate all addresses at runtime
Object.entries(CONTRACT_ADDRESSES).forEach(([key, value]) => {
  if (!addressRegex.test(value)) {
    throw new Error(`Invalid contract address for ${key}: ${value}`)
  }
})

export type ContractAddresses = typeof CONTRACT_ADDRESSES

export interface PositionManagerParams {
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  amount0Desired: BigNumber
  amount1Desired: BigNumber
  amount0Min: number
  amount1Min: number
  recipient: string
  deadline: number
}
