import { BigNumber, Wallet } from 'ethers'
import { ethers } from 'hardhat'
import { Fixture } from 'ethereum-waffle'
import { FeeAmount, TICK_SPACINGS } from './utilities'

// Contract types
import type { MockTimeUniswapV3Pool } from '../../typechain/contracts/v3/test/MockTimeUniswapV3Pool'
import type { UniswapV3Factory } from '../../typechain/contracts/v3/UniswapV3Factory'
import type { TestERC20 } from '../../typechain/contracts/v3/test/TestERC20'
import type { TestUniswapV3Callee } from '../../typechain/contracts/v3/test/TestUniswapV3Callee'
import type { TestUniswapV3Router } from '../../typechain/contracts/v3/test/TestUniswapV3Router'
import type { MockTimeUniswapV3PoolDeployer } from '../../typechain/contracts/v3/test/MockTimeUniswapV3PoolDeployer'

interface FactoryFixture {
  factory: UniswapV3Factory
}

async function factoryFixture(): Promise<FactoryFixture> {
  const factoryFactory = await ethers.getContractFactory('UniswapV3Factory')
  const factory = (await factoryFactory.deploy()) as UniswapV3Factory
  return { factory }
}

interface TokensFixture {
  token0: TestERC20
  token1: TestERC20
  token2: TestERC20
}

async function tokensFixture(): Promise<TokensFixture> {
  const tokenFactory = await ethers.getContractFactory('TestERC20')
  const tokenA = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20
  const tokenB = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20
  const tokenC = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20

  const [token0, token1, token2] = [tokenA, tokenB, tokenC].sort((tokenA, tokenB) =>
    tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? -1 : 1
  )

  return { token0, token1, token2 }
}

type TokensAndFactoryFixture = FactoryFixture & TokensFixture

interface PoolFixture extends TokensAndFactoryFixture {
  pool: MockTimeUniswapV3Pool
  swapTargetCallee: TestUniswapV3Callee
  swapTargetRouter: TestUniswapV3Router
}

// Monday, October 5, 2020 9:00:00 AM GMT-05:00
export const TEST_POOL_START_TIME = 1601906400

export const poolFixture: Fixture<PoolFixture> = async function (): Promise<PoolFixture> {
  const { factory } = await factoryFixture()
  const { token0, token1, token2 } = await tokensFixture()

  const calleeContractFactory = await ethers.getContractFactory('TestUniswapV3Callee')
  const routerContractFactory = await ethers.getContractFactory('TestUniswapV3Router')

  const swapTargetCallee = (await calleeContractFactory.deploy()) as TestUniswapV3Callee
  const swapTargetRouter = (await routerContractFactory.deploy()) as TestUniswapV3Router

  const MockTimeUniswapV3PoolDeployerFactory = await ethers.getContractFactory('MockTimeUniswapV3PoolDeployer')
  const MockTimeUniswapV3PoolFactory = await ethers.getContractFactory('MockTimeUniswapV3Pool')

  const mockTimePoolDeployer = await MockTimeUniswapV3PoolDeployerFactory.deploy()
  const tx = await mockTimePoolDeployer.deploy(
    factory.address,
    token0.address,
    token1.address,
    FeeAmount.MEDIUM,
    TICK_SPACINGS[FeeAmount.MEDIUM]
  )

  const receipt = await tx.wait()
  const poolAddress = receipt.events?.[0].args?.pool as string
  const pool = MockTimeUniswapV3PoolFactory.attach(poolAddress) as MockTimeUniswapV3Pool

  return {
    token0,
    token1,
    token2,
    factory,
    pool,
    swapTargetCallee,
    swapTargetRouter,
  }
}
