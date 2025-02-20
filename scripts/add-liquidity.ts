import { ethers } from 'hardhat'
import { parseUnits } from 'ethers/lib/utils'

async function main() {
  const [owner] = await ethers.getSigners()
  console.log('Using owner account:', owner.address)

  // Pool and token addresses
  const poolAddress = '0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347'
  const token0Address = '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9' // TT1
  const token1Address = '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122' // TT2

  // Token amounts (1000 tokens each with 18 decimals)
  const amount0 = parseUnits('1000', 18)
  const amount1 = parseUnits('1000', 18)

  // Get token contracts
  const token0Contract = await ethers.getContractAt('IERC20', token0Address, owner)
  const token1Contract = await ethers.getContractAt('IERC20', token1Address, owner)

  // Get initial token balances
  const token0BalanceBefore = await token0Contract.balanceOf(owner.address)
  const token1BalanceBefore = await token1Contract.balanceOf(owner.address)
  console.log('Token balances before:')
  console.log('TT1:', ethers.utils.formatUnits(token0BalanceBefore, 18))
  console.log('TT2:', ethers.utils.formatUnits(token1BalanceBefore, 18))

  // Get pool contract with full interface
  const poolContract = await ethers.getContractAt([
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
    'function mint(address recipient, int24 tickLower, int24 tickUpper, uint128 amount, bytes calldata data) external returns (uint256 amount0, uint256 amount1)',
    'function liquidity() external view returns (uint128)',
    'function positions(bytes32) external view returns (uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function fee() external view returns (uint24)',
    'function initialize(uint160 sqrtPriceX96) external'
  ], poolAddress, owner)

  // Get pool details and current state
  const [slot0Data, token0Addr, token1Addr, poolFee] = await Promise.all([
    poolContract.slot0(),
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee()
  ])
  console.log('Pool details:')
  console.log('Token0:', token0Addr)
  console.log('Token1:', token1Addr)
  console.log('Fee:', poolFee)
  console.log('Current sqrtPriceX96:', slot0Data.sqrtPriceX96.toString())
  console.log('Current tick:', slot0Data.tick)

  // Calculate liquidity amount based on token amounts and price
  const sqrtRatioX96 = slot0Data.sqrtPriceX96
  const liquidity = amount0.mul(sqrtRatioX96).div(ethers.BigNumber.from(2).pow(96))
  console.log('Calculated liquidity:', liquidity.toString())

  // Calculate tick range for concentrated liquidity
  const tickSpacing = 60 // MEDIUM fee tier
  const currentTick = slot0Data.tick
  const tickLower = Math.floor(currentTick / tickSpacing) * tickSpacing
  const tickUpper = tickLower + tickSpacing

  // Calculate position key
  const positionKey = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['address', 'int24', 'int24'],
      [owner.address, tickLower, tickUpper]
    )
  )

  // Get initial position state
  const positionBefore = await poolContract.positions(positionKey)
  console.log('Position liquidity before:', positionBefore.liquidity.toString())

  // Approve tokens for pool
  await token0Contract.approve(poolAddress, amount0)
  await token1Contract.approve(poolAddress, amount1)
  console.log('Tokens approved for pool')

  // Add liquidity
  console.log('Adding liquidity...')
  console.log('Current tick:', currentTick)
  console.log('Tick range:', tickLower, '-', tickUpper)
  console.log('Amount0:', ethers.utils.formatUnits(amount0, 18))
  console.log('Amount1:', ethers.utils.formatUnits(amount1, 18))

  // Encode mint callback data
  const encodedData = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address', 'address'],
    [token0Address, token1Address, owner.address]
  )

  // Add liquidity
  console.log('Adding liquidity to pool...')
  const tx = await poolContract.mint(
    owner.address,
    tickLower,
    tickUpper,
    liquidity,
    encodedData,
    { gasLimit: 5000000 }
  )
  const receipt = await tx.wait()
  console.log('Transaction receipt:', receipt)

  // Verify position after mint
  const positionAfter = await poolContract.positions(positionKey)
  console.log('Position liquidity after:', positionAfter.liquidity.toString())

  // Get final token balances
  const token0BalanceAfter = await token0Contract.balanceOf(owner.address)
  const token1BalanceAfter = await token1Contract.balanceOf(owner.address)
  console.log('Token balances after mint:')
  console.log('TT1:', ethers.utils.formatUnits(token0BalanceAfter, 18))
  console.log('TT2:', ethers.utils.formatUnits(token1BalanceAfter, 18))

  // Verify liquidity changes
  const finalLiquidity = await poolContract.liquidity()
  console.log('Final pool liquidity:', finalLiquidity.toString())

  // Calculate and display token changes
  const tt1Change = token0BalanceBefore.sub(token0BalanceAfter)
  const tt2Change = token1BalanceBefore.sub(token1BalanceAfter)
  console.log('Token changes:')
  console.log('TT1 used:', ethers.utils.formatUnits(tt1Change, 18))
  console.log('TT2 used:', ethers.utils.formatUnits(tt2Change, 18))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
