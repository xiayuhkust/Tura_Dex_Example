import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'

const ADDRESSES = {
  TOKEN0: '0xB345Db6f7551be988894F30D76057295aaA89f53',
  TOKEN1: '0x6BA591459B1Cea054bC5c174197Db6164a6100d9',
  POOL: '0x4Ea9F8e2A47C0Cd221290457C33d0ef211089312'
}

import { TickMath } from '../contracts/v3/libraries/TickMath'

function encodePriceSqrt(reserve1: BigNumber | number, reserve0: BigNumber | number): BigNumber {
  return BigNumber.from(TickMath.getSqrtRatioAtTick(TickMath.MIN_TICK + 1))
}

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

  // Mint some tokens to wallet1 for testing
  const mintAmount = ethers.utils.parseEther('10')
  await token0.mint(wallet1.address, mintAmount)
  console.log('Minted', ethers.utils.formatEther(mintAmount), 'token0 to wallet1')

  // Approve pool to spend tokens
  const swapAmount = ethers.utils.parseEther('1')
  await token0.connect(wallet1).approve(ADDRESSES.POOL, swapAmount)
  console.log('Approved pool to spend token0')

  // Execute swap
  console.log('Executing swap...')
  try {
    const sqrtPriceLimitX96 = encodePriceSqrt(1, 2) // Set price limit to 1:2 for safety
    console.log('Price limit:', sqrtPriceLimitX96.toString())
    
    const tx = await pool.connect(wallet1).swap(
      wallet1.address,
      true, // zeroForOne
      swapAmount,
      sqrtPriceLimitX96,
      '0x',
      { gasLimit: 1000000 }
    )
    console.log('Swap transaction hash:', tx.hash)
    await tx.wait()
    console.log('Swap successful')
  } catch (error) {
    console.error('Swap failed:', error.message)
    if (error.data) {
      const decodedError = ethers.utils.defaultAbiCoder.decode(['string'], error.data.slice(4))
      console.error('Decoded error:', decodedError[0])
    }
    throw error
  }

  // Get final balances
  const finalBalance0 = await token0.balanceOf(wallet1.address)
  const finalBalance1 = await token1.balanceOf(wallet1.address)
  console.log('Final token0 balance:', ethers.utils.formatEther(finalBalance0))
  console.log('Final token1 balance:', ethers.utils.formatEther(finalBalance1))

  // Get pool state
  const slot0 = await pool.slot0()
  console.log('Pool price after swap:', slot0.sqrtPriceX96.toString())
  console.log('Pool tick after swap:', slot0.tick.toString())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
