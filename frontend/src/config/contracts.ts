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
  WETH: process.env.REACT_APP_WETH_ADDRESS,
  FACTORY: process.env.REACT_APP_FACTORY_ADDRESS,
  ROUTER: process.env.REACT_APP_ROUTER_ADDRESS,
  POSITION_MANAGER: process.env.REACT_APP_POSITION_MANAGER_ADDRESS,
  
  // Test tokens
  TEST_TOKEN_1: process.env.REACT_APP_TEST_TOKEN_1_ADDRESS,
  TEST_TOKEN_2: process.env.REACT_APP_TEST_TOKEN_2_ADDRESS,
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
