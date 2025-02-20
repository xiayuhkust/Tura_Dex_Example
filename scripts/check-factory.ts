import { ethers } from 'hardhat'

async function main() {
  const [owner] = await ethers.getSigners()
  console.log('Using owner account:', owner.address)

  const FACTORY_ADDRESS = '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d'
  const factoryContract = await ethers.getContractAt([
    'function owner() external view returns (address)',
    'function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)',
    'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
    'function enableFeeAmount(uint24 fee, int24 tickSpacing) external'
  ], FACTORY_ADDRESS, owner)

  // Check factory owner
  const factoryOwner = await factoryContract.owner()
  console.log('Factory owner:', factoryOwner)

  // Check pool
  const token0Address = '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9' // TT1
  const token1Address = '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122' // TT2
  const poolAddress = await factoryContract.getPool(token0Address, token1Address, 3000)
  console.log('Pool address:', poolAddress)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
