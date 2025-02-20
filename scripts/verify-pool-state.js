const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners()
  console.log('Using owner account:', owner.address)

  // Pool and token addresses
  const poolAddress = '0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347'
  const token0Address = '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9' // TT1
  const token1Address = '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122' // TT2

  // Get pool contract
  const poolContract = await ethers.getContractAt([
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
    'function liquidity() external view returns (uint128)',
    'function positions(bytes32) external view returns (uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function fee() external view returns (uint24)'
  ], poolAddress, owner)

  // Get pool state
  const [slot0Data, currentLiquidity, token0, token1, fee] = await Promise.all([
    poolContract.slot0(),
    poolContract.liquidity(),
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee()
  ])

  console.log('Pool State:')
  console.log('Token0:', token0)
  console.log('Token1:', token1)
  console.log('Fee:', fee)
  console.log('Current sqrtPriceX96:', slot0Data.sqrtPriceX96.toString())
  console.log('Current tick:', slot0Data.tick)
  console.log('Pool liquidity:', currentLiquidity.toString())

  // Get token contracts
  const token0Contract = await ethers.getContractAt('IERC20', token0, owner)
  const token1Contract = await ethers.getContractAt('IERC20', token1, owner)

  // Get pool token balances
  const [poolToken0Balance, poolToken1Balance] = await Promise.all([
    token0Contract.balanceOf(poolAddress),
    token1Contract.balanceOf(poolAddress)
  ])

  console.log('Pool token balances:')
  console.log('Token0 balance:', ethers.utils.formatUnits(poolToken0Balance, 18))
  console.log('Token1 balance:', ethers.utils.formatUnits(poolToken1Balance, 18))

  // Calculate position key
  const tickSpacing = 60
  const tickLower = Math.floor(slot0Data.tick / tickSpacing) * tickSpacing
  const tickUpper = tickLower + tickSpacing
  const positionKey = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['address', 'int24', 'int24'],
      [owner.address, tickLower, tickUpper]
    )
  )

  // Get position state
  const position = await poolContract.positions(positionKey)
  console.log('Position state:')
  console.log('Liquidity:', position.liquidity.toString())
  console.log('Tokens owed 0:', position.tokensOwed0.toString())
  console.log('Tokens owed 1:', position.tokensOwed1.toString())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
