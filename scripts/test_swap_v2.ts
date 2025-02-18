import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'

const ADDRESSES = {
  TOKEN0: '0xB345Db6f7551be988894F30D76057295aaA89f53',
  TOKEN1: '0x6BA591459B1Cea054bC5c174197Db6164a6100d9',
  POOL: '0x4Ea9F8e2A47C0Cd221290457C33d0ef211089312'
}

// Constants from v3-core
const MIN_SQRT_RATIO = BigNumber.from('4295128739')
const MAX_SQRT_RATIO = BigNumber.from('1461446703485210103287273052203988822378723970342')

async function main() {
  const [_, wallet1] = await ethers.getSigners()
  console.log('Testing swap with wallet:', wallet1.address)

  // Get contract instances
  const token0 = await ethers.getContractAt('TestERC20', ADDRESSES.TOKEN0)
  const token1 = await ethers.getContractAt('TestERC20', ADDRESSES.TOKEN1)
  const pool = await ethers.getContractAt('UniswapV3Pool', ADDRESSES.POOL)

  // Get initial balances
  const initialBalance0 = await token0.balanceOf(wallet1.address)
  const initialBalance1 = await token1.balanceOf(wallet1.address)
  console.log('Initial token0 balance:', ethers.utils.formatEther(initialBalance0))
  console.log('Initial token1 balance:', ethers.utils.formatEther(initialBalance1))

  // Deploy TestUniswapV3Callee for swap callback
  const TestCalleeFactory = await ethers.getContractFactory('TestUniswapV3Callee')
  const testCallee = await TestCalleeFactory.deploy()
  await testCallee.deployed()
  console.log('TestCallee deployed to:', testCallee.address)

  // Mint some tokens to wallet1 for testing
  const mintAmount = ethers.utils.parseEther('10')
  await token0.mint(wallet1.address, mintAmount)
  console.log('Minted', ethers.utils.formatEther(mintAmount), 'token0 to wallet1')

  // Approve testCallee to spend tokens
  const swapAmount = ethers.utils.parseEther('1')
  await token0.connect(wallet1).approve(testCallee.address, swapAmount)
  console.log('Approved TestCallee to spend token0')

  // Get pool state before swap
  const slot0Before = await pool.slot0()
  console.log('Pool price before swap:', slot0Before.sqrtPriceX96.toString())
  console.log('Pool tick before swap:', slot0Before.tick.toString())

  // Execute swap through test callee
  try {
    console.log('Executing swap through TestCallee...')
    const tx = await testCallee.connect(wallet1).swapExact0For1(
      ADDRESSES.POOL,
      swapAmount,
      wallet1.address,
      MIN_SQRT_RATIO.add(1),
      { gasLimit: 1000000 }
    )
    console.log('Swap transaction hash:', tx.hash)
    await tx.wait()
    console.log('Swap successful')

    // Get final balances
    const finalBalance0 = await token0.balanceOf(wallet1.address)
    const finalBalance1 = await token1.balanceOf(wallet1.address)
    console.log('Final token0 balance:', ethers.utils.formatEther(finalBalance0))
    console.log('Final token1 balance:', ethers.utils.formatEther(finalBalance1))

    // Get pool state after swap
    const slot0After = await pool.slot0()
    console.log('Pool price after swap:', slot0After.sqrtPriceX96.toString())
    console.log('Pool tick after swap:', slot0After.tick.toString())
  } catch (error) {
    console.error('Swap failed:', error.message)
    if (error.data) {
      try {
        const decodedError = ethers.utils.defaultAbiCoder.decode(['string'], error.data.slice(4))
        console.error('Decoded error:', decodedError[0])
      } catch (decodeError) {
        console.error('Could not decode error data:', error.data)
      }
    }
    throw error
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
