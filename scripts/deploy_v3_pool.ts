import { ethers } from 'hardhat'
import '@nomiclabs/hardhat-ethers'
import { BigNumber } from 'ethers'

const FeeAmount = {
  LOW: 500,
  MEDIUM: 3000,
  HIGH: 10000,
}

const TICK_SPACINGS: { [amount in number]: number } = {
  [FeeAmount.LOW]: 10,
  [FeeAmount.MEDIUM]: 60,
  [FeeAmount.HIGH]: 200,
}

function encodePriceSqrt(reserve1: BigNumber | number, reserve0: BigNumber | number): BigNumber {
  return BigNumber.from('1000000000000000000000000')
}

function getMinTick(tickSpacing: number): number {
  return Math.ceil(-887272 / tickSpacing) * tickSpacing
}

function getMaxTick(tickSpacing: number): number {
  return Math.floor(887272 / tickSpacing) * tickSpacing
}

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with account:', deployer.address)

  // Deploy test tokens
  const TestERC20Factory = await ethers.getContractFactory('TestERC20')
  const token0 = await TestERC20Factory.deploy(ethers.utils.parseEther('1000000'))
  const token1 = await TestERC20Factory.deploy(ethers.utils.parseEther('1000000'))
  await token0.deployed()
  await token1.deployed()
  console.log('Token0 deployed to:', token0.address)
  console.log('Token1 deployed to:', token1.address)

  // Deploy factory
  const UniswapV3FactoryFactory = await ethers.getContractFactory('UniswapV3Factory')
  const factory = await UniswapV3FactoryFactory.deploy()
  await factory.deployed()
  console.log('Factory deployed to:', factory.address)

  // Deploy test callee
  const TestUniswapV3CalleeFactory = await ethers.getContractFactory('TestUniswapV3Callee')
  const testCallee = await TestUniswapV3CalleeFactory.deploy()
  await testCallee.deployed()
  console.log('TestCallee deployed to:', testCallee.address)

  // Create pool
  const tx = await factory.createPool(token0.address, token1.address, FeeAmount.MEDIUM)
  await tx.wait()
  const poolAddress = await factory.getPool(token0.address, token1.address, FeeAmount.MEDIUM)
  console.log('Pool deployed to:', poolAddress)

  // Initialize pool
  const pool = await ethers.getContractAt('UniswapV3Pool', poolAddress)
  const initTx = await pool.initialize(encodePriceSqrt(1, 1))
  await initTx.wait()
  console.log('Pool initialized')

  // Add initial liquidity
  const amount0Desired = ethers.utils.parseEther('1')
  const amount1Desired = ethers.utils.parseEther('1')
  
  await token0.approve(poolAddress, amount0Desired)
  await token1.approve(poolAddress, amount1Desired)
  
  const minTick = getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM])
  const maxTick = getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM])
  
  await pool.mint(
    deployer.address,
    minTick,
    maxTick,
    amount0Desired,
    ethers.utils.defaultAbiCoder.encode(
      ['uint256', 'uint256'],
      [amount0Desired, amount1Desired]
    ),
    { gasLimit: 1000000 }
  )
  console.log('Initial liquidity added')

  // Verify deployment
  const slot0 = await pool.slot0()
  console.log('Pool initialized with sqrtPrice:', slot0.sqrtPriceX96.toString())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
