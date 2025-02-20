import { ethers } from 'hardhat'

async function main() {
  const [owner] = await ethers.getSigners()
  console.log('Using owner account:', owner.address)

  const FACTORY_ADDRESS = '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d'
  const factoryContract = await ethers.getContractAt([
    'function owner() external view returns (address)',
    'function feeAmountTickSpacing(uint24 fee) external view returns (int24)',
    'function enableFeeAmount(uint24 fee, int24 tickSpacing) external'
  ], FACTORY_ADDRESS, owner)

  // Check fee tier
  const tickSpacing = await factoryContract.feeAmountTickSpacing(3000)
  console.log('Tick spacing for fee 3000:', tickSpacing)

  if (tickSpacing === 0) {
    console.log('Fee tier not enabled, enabling...')
    const tx = await factoryContract.enableFeeAmount(3000, 60)
    await tx.wait()
    console.log('Fee tier enabled')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
