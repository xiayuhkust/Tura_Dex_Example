import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'

const ADDRESSES = {
  TOKEN0: '0xB345Db6f7551be988894F30D76057295aaA89f53',
  TOKEN1: '0x6BA591459B1Cea054bC5c174197Db6164a6100d9',
  POOL: '0x4Ea9F8e2A47C0Cd221290457C33d0ef211089312',
  FACTORY: '0xa4886244EE985BF17f498a91d928D95FC73e3489'
}

async function main() {
  console.log('Verifying deployment...\n')

  // Get contract instances
  const token0 = await ethers.getContractAt('TestERC20', ADDRESSES.TOKEN0)
  const token1 = await ethers.getContractAt('TestERC20', ADDRESSES.TOKEN1)
  const pool = await ethers.getContractAt('UniswapV3Pool', ADDRESSES.POOL)
  const factory = await ethers.getContractAt('UniswapV3Factory', ADDRESSES.FACTORY)

  // Verify factory owner
  const factoryOwner = await factory.owner()
  console.log('Factory owner:', factoryOwner)

  // Verify pool creation
  const poolAddress = await factory.getPool(ADDRESSES.TOKEN0, ADDRESSES.TOKEN1, 3000)
  console.log('Pool address from factory:', poolAddress)
  console.log('Matches deployed pool:', poolAddress.toLowerCase() === ADDRESSES.POOL.toLowerCase())

  // Get pool state
  const slot0 = await pool.slot0()
  console.log('\nPool State:')
  console.log('- Current price:', slot0.sqrtPriceX96.toString())
  console.log('- Current tick:', slot0.tick.toString())
  console.log('- Fee protocol:', slot0.feeProtocol.toString())
  
  // Get pool liquidity
  const liquidity = await pool.liquidity()
  console.log('- Current liquidity:', liquidity.toString())

  // Get token info
  console.log('\nToken Information:')
  console.log(`Token0: ${ADDRESSES.TOKEN0}`)
  console.log(`Token1: ${ADDRESSES.TOKEN1}`)
  
  // Verify token contracts
  const token0Code = await ethers.provider.getCode(ADDRESSES.TOKEN0)
  const token1Code = await ethers.provider.getCode(ADDRESSES.TOKEN1)
  console.log('Token0 is contract:', token0Code !== '0x')
  console.log('Token1 is contract:', token1Code !== '0x')

  console.log('\nVerification complete!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
