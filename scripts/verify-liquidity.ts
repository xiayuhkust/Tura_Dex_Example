import { ethers } from 'hardhat'
import { parseUnits } from 'ethers/lib/utils'

async function main() {
  const [owner] = await ethers.getSigners()
  console.log('Using owner account:', owner.address)

  // Pool and token addresses
  const poolAddress = '0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347'
  const token0Address = '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9' // TT1
  const token1Address = '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122' // TT2

  // Get pool contract with full interface
  const poolContract = await ethers.getContractAt([
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
    'function liquidity() external view returns (uint128)',
    'function positions(bytes32) external view returns (uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function fee() external view returns (uint24)'
  ], poolAddress, owner)

  // Get pool status
  const { tick } = await poolContract.slot0()
  console.log('Current tick:', tick)

  // Calculate position key
  const tickSpacing = 60 // MEDIUM fee tier
  const tickLower = Math.floor(tick / tickSpacing) * tickSpacing
  const tickUpper = tickLower + tickSpacing

  const positionKey = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['address', 'int24', 'int24'],
      [owner.address, tickLower, tickUpper]
    )
  )

  // Get position details
  const position = await poolContract.positions(positionKey)
  console.log('Position liquidity:', position.liquidity.toString())

  // Get pool liquidity
  const poolLiquidity = await poolContract.liquidity()
  console.log('Pool liquidity:', poolLiquidity.toString())

  // Get token contracts
  const token0Contract = await ethers.getContractAt('IERC20', token0Address, owner)
  const token1Contract = await ethers.getContractAt('IERC20', token1Address, owner)

  // Get token balances
  const token0Balance = await token0Contract.balanceOf(poolAddress)
  const token1Balance = await token1Contract.balanceOf(poolAddress)
  console.log('Pool token balances:')
  console.log('TT1:', ethers.utils.formatUnits(token0Balance, 18))
  console.log('TT2:', ethers.utils.formatUnits(token1Balance, 18))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
