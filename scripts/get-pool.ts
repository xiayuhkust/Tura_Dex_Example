import { ethers } from 'hardhat'

async function main() {
  const [owner] = await ethers.getSigners()
  console.log('Using owner account:', owner.address)

  const FACTORY_ADDRESS = '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d'
  const TT1_ADDRESS = '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9'
  const TT2_ADDRESS = '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122'
  const FEE_TIER = 3000 // MEDIUM fee tier

  const factoryContract = await ethers.getContractAt(
    [
      'function getPool(address,address,uint24) external view returns (address)',
      'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)'
    ],
    FACTORY_ADDRESS,
    owner
  )

  const poolAddress = await factoryContract.getPool(TT1_ADDRESS, TT2_ADDRESS, FEE_TIER)
  console.log('TT1/TT2 Pool Address:', poolAddress)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
