import type { Token } from './Token'

import { ethers } from 'ethers'

export interface Pool {
  address: string
  token0: Token
  token1: Token
  token0Symbol: string
  token1Symbol: string
  fee: number
  liquidity: string
  userLiquidity?: ethers.BigNumber
}

export interface PoolDetails extends Pool {
  // Add any additional pool details here
}
