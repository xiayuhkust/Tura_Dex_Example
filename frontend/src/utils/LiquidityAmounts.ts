// Copied from @uniswap/v3-periphery for frontend use
import { ethers } from 'ethers'

export class LiquidityAmounts {
  /**
   * Computes the maximum amount of liquidity received for a given amount of token0, token1,
   * and the prices at the tick boundaries
   */
  public static getLiquidityForAmounts(
    sqrtRatioX96: ethers.BigNumber,
    sqrtRatioAX96: ethers.BigNumber,
    sqrtRatioBX96: ethers.BigNumber,
    amount0: ethers.BigNumber,
    amount1: ethers.BigNumber
  ): ethers.BigNumber {
    if (sqrtRatioAX96.gt(sqrtRatioBX96)) {
      [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
    }

    // Calculate liquidity based on current price and range
    if (sqrtRatioX96.lte(sqrtRatioAX96)) {
      return LiquidityAmounts.getLiquidityForAmount0(sqrtRatioAX96, sqrtRatioBX96, amount0)
    } else if (sqrtRatioX96.lt(sqrtRatioBX96)) {
      const liquidity0 = LiquidityAmounts.getLiquidityForAmount0(sqrtRatioX96, sqrtRatioBX96, amount0)
      const liquidity1 = LiquidityAmounts.getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioX96, amount1)
      return liquidity0.lt(liquidity1) ? liquidity0 : liquidity1
    } else {
      return LiquidityAmounts.getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1)
    }
  }

  private static getLiquidityForAmount0(
    sqrtRatioAX96: ethers.BigNumber,
    sqrtRatioBX96: ethers.BigNumber,
    amount0: ethers.BigNumber
  ): ethers.BigNumber {
    if (sqrtRatioAX96.gt(sqrtRatioBX96)) {
      [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
    }

    return amount0.mul(sqrtRatioAX96.mul(sqrtRatioBX96).div(ethers.constants.WeiPerEther)).div(sqrtRatioBX96.sub(sqrtRatioAX96))
  }

  private static getLiquidityForAmount1(
    sqrtRatioAX96: ethers.BigNumber,
    sqrtRatioBX96: ethers.BigNumber,
    amount1: ethers.BigNumber
  ): ethers.BigNumber {
    if (sqrtRatioAX96.gt(sqrtRatioBX96)) {
      [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
    }

    return amount1.mul(ethers.constants.WeiPerEther).div(sqrtRatioBX96.sub(sqrtRatioAX96))
  }
}
