import { ethers, waffle } from 'hardhat'
import { MockTimeUniswapV3Pool } from '../typechain/contracts/v3/test/MockTimeUniswapV3Pool'
import { TestERC20 } from '../typechain/contracts/v3/test/TestERC20'
import { TestUniswapV3Callee } from '../typechain/contracts/v3/test/TestUniswapV3Callee'
import { expect } from './shared/expect'
import { poolFixture } from './shared/fixtures'
import { Wallet } from 'ethers'
import {
  FeeAmount,
  TICK_SPACINGS,
  createPoolFunctions,
  encodePriceSqrt,
  expandTo18Decimals,
  getMinTick,
  getMaxTick,
  getMaxLiquidityPerTick,
  MAX_SQRT_RATIO,
  MaxUint128,
  MIN_SQRT_RATIO,
} from './shared/utilities'

const createFixtureLoader = waffle.createFixtureLoader
type PoolFunctions = ReturnType<typeof createPoolFunctions>

describe('UniswapV3Pool Swaps', () => {
  let wallet: Wallet, other: Wallet
  let token0: TestERC20
  let token1: TestERC20
  let pool: MockTimeUniswapV3Pool
  let swapTarget: TestUniswapV3Callee
  let poolFunctions: PoolFunctions

  let loadFixture: ReturnType<typeof createFixtureLoader>

  before('create fixture loader', async () => {
    const wallets = await (ethers as any).getSigners()
    ;[wallet, other] = wallets
    loadFixture = createFixtureLoader(wallets)
  })

  beforeEach('deploy fixture', async () => {
    const fixture = await loadFixture(poolFixture)
    token0 = fixture.token0
    token1 = fixture.token1
    pool = fixture.pool
    swapTarget = fixture.swapTargetCallee
    poolFunctions = createPoolFunctions({
      swapTarget,
      token0,
      token1,
      pool,
    })

    await token0.approve(swapTarget.address, expandTo18Decimals(1_000_000))
    await token1.approve(swapTarget.address, expandTo18Decimals(1_000_000))

  })

  describe('swaps', () => {
    const liquidity = expandTo18Decimals(1000)
    const swapAmount = expandTo18Decimals(1)

    beforeEach('initialize pool', async () => {
      await pool.initialize(encodePriceSqrt(1, 1))
      await pool.setFeeProtocol(0, 0)
      await pool.advanceTime(1)
      await poolFunctions.mint(wallet.address, getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]), getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]), liquidity)
    })

    it('zero for one exact input', async () => {
      const balanceBefore = await token1.balanceOf(wallet.address)
      await poolFunctions.swapExact0For1(swapAmount, wallet.address)
      const balanceAfter = await token1.balanceOf(wallet.address)
      expect(balanceAfter.sub(balanceBefore)).to.be.gt(0)
    })

    it('one for zero exact input', async () => {
      const balanceBefore = await token0.balanceOf(wallet.address)
      await poolFunctions.swapExact1For0(swapAmount, wallet.address)
      const balanceAfter = await token0.balanceOf(wallet.address)
      expect(balanceAfter.sub(balanceBefore)).to.be.gt(0)
    })

    it('protocol fee collection', async () => {
      await pool.setFeeProtocol(6, 6)
      await poolFunctions.swapExact0For1(swapAmount, wallet.address)
      await poolFunctions.swapExact1For0(swapAmount, wallet.address)
      const result = await pool.collectProtocol(wallet.address, MaxUint128, MaxUint128)
      const receipt = await result.wait()
      const event = receipt.events?.find(e => e.event === 'CollectProtocol')
      expect(event?.args?.amount0).to.be.gt(0)
      expect(event?.args?.amount1).to.be.gt(0)
    })

    it('swap with price limit', async () => {
      const sqrtPriceLimitX96 = encodePriceSqrt(1, 2)
      await expect(poolFunctions.swapExact0For1(swapAmount, wallet.address, sqrtPriceLimitX96))
        .to.not.be.reverted
    })

    it('handles tick crossing', async () => {
      const largeLiquidity = expandTo18Decimals(10000)
      await poolFunctions.mint(wallet.address, getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]), getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]), largeLiquidity)
      const largeSwapAmount = expandTo18Decimals(100)
      await poolFunctions.swapExact0For1(largeSwapAmount, wallet.address)
      const { tick } = await pool.slot0()
      expect(tick).to.be.lt(0)
    })
  })
})
