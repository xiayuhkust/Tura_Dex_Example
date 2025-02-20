import { BigNumber } from 'ethers'

export function encodePriceSqrt(reserve1: number, reserve0: number): BigNumber {
  const numerator = BigNumber.from(reserve1).mul(BigNumber.from(2).pow(96))
  const denominator = BigNumber.from(reserve0)
  return numerator.div(denominator)
}
