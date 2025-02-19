/**
 * Contract addresses and constants for the Tura DEX.
 * All addresses are verified against deployment_records.md
 */

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
  FACTORY: '0x511CE2380a70bE66FAf44a5baaBf11E92D654905',
  ROUTER: '0xB492Bf5FBfA79364149CC76B77b8bd78BecD1416',
  
  // Test tokens
  TEST_TOKEN_1: '0xf7430841c1917Fee24B04dBbd0b809F36E5Ad716',
  TEST_TOKEN_2: '0x3Cbc85319E3D9d6b29DDe06f591017e9f9666652',
} as const

// Validate all addresses at runtime
Object.entries(CONTRACT_ADDRESSES).forEach(([key, value]) => {
  if (!addressRegex.test(value)) {
    throw new Error(`Invalid contract address for ${key}: ${value}`)
  }
})

export type ContractAddresses = typeof CONTRACT_ADDRESSES
