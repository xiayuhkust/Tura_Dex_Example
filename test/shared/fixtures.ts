import { BigNumber, Contract, Wallet } from 'ethers'
import { ethers } from 'hardhat'
import { Fixture } from 'ethereum-waffle'
import { FeeAmount, TICK_SPACINGS } from './utilities'

interface FactoryFixture {
  factory: Contract
}

async function factoryFixture(): Promise<FactoryFixture> {
  const factoryFactory = await ethers.getContractFactory('UniswapV3Factory')
  const factory = await factoryFactory.deploy()
  return { factory }
}

interface TokensFixture {
  token0: Contract
  token1: Contract
  token2: Contract
}

async function tokensFixture(): Promise<TokensFixture> {
  const tokenFactory = await ethers.getContractFactory('TestERC20')
  const tokenA = await tokenFactory.deploy(BigNumber.from(2).pow(255))
  const tokenB = await tokenFactory.deploy(BigNumber.from(2).pow(255))
  const tokenC = await tokenFactory.deploy(BigNumber.from(2).pow(255))

  const [token0, token1, token2] = [tokenA, tokenB, tokenC].sort((tokenA, tokenB) =>
    tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? -1 : 1
  )

  return { token0, token1, token2 }
}

type TokensAndFactoryFixture = FactoryFixture & TokensFixture

interface PoolFixture extends TokensAndFactoryFixture {
  pool: Contract
  swapTargetCallee: Contract
  swapTargetRouter: Contract
}

// Monday, October 5, 2020 9:00:00 AM GMT-05:00
export const TEST_POOL_START_TIME = 1601906400

export const poolFixture: Fixture<PoolFixture> = async function (): Promise<PoolFixture> {
  const { factory } = await factoryFixture()
  const { token0, token1, token2 } = await tokensFixture()

  const calleeContractFactory = await ethers.getContractFactory('TestUniswapV3Callee')
  const routerContractFactory = await ethers.getContractFactory('TestUniswapV3Router')

  const swapTargetCallee = await calleeContractFactory.deploy()
  const swapTargetRouter = await routerContractFactory.deploy()

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
  const pool = MockTimeUniswapV3PoolFactory.attach(poolAddress)

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
