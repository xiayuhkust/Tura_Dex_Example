import { ethers } from "hardhat";

async function main() {
  console.log("Initializing TT1/TURA pool (v3)...");

  const ADDRESSES = {
    POOL: '0xdFc9AFF6A74f7678A84312c875184B4ed7e8E596',
    TT1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
    WETH: '0xc8F7d7989a409472945b00177396f4e9b8601DF3'
  };

  // Get owner account
  const [owner] = await ethers.getSigners();
  console.log("Using owner account:", owner.address);

  // Get token contracts
  const tt1 = await ethers.getContractAt("contracts/interfaces/IERC20Minimal.sol:IERC20Minimal", ADDRESSES.TT1);
  const weth = await ethers.getContractAt("contracts/interfaces/IERC20Minimal.sol:IERC20Minimal", ADDRESSES.WETH);

  // Get pool contract
  const poolContract = await ethers.getContractAt("contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool", ADDRESSES.POOL);

  // Check if pool is already initialized
  const slot0 = await poolContract.slot0();
  if (!slot0.sqrtPriceX96.eq(0)) {
    console.log("Pool is already initialized with sqrt price:", slot0.sqrtPriceX96.toString());
  } else {
    // Initialize with price of 1
    const sqrtPriceX96 = ethers.BigNumber.from('1').shl(96);
    await poolContract.initialize(sqrtPriceX96);
    console.log("\nPool initialized with sqrt price:", sqrtPriceX96.toString());
  }

  // Approve tokens with smaller amount
  const amount = ethers.utils.parseEther("10"); // Try with 10 tokens
  await tt1.approve(ADDRESSES.POOL, amount);
  await weth.approve(ADDRESSES.POOL, amount);
  console.log("\nTokens approved for pool");

  // Add initial liquidity with smaller range
  const tickSpacing = 60; // 0.3% fee tier
  const tickLower = -120; // Much smaller range
  const tickUpper = 120;  // Much smaller range

  const mintTx = await poolContract.mint(
    owner.address,
    tickLower,
    tickUpper,
    amount,
    '0x',
    { gasLimit: 500000 } // Set explicit gas limit
  );
  await mintTx.wait();
  console.log("\nLiquidity added successfully");

  // Verify liquidity
  const liquidity = await poolContract.liquidity();
  console.log("\nPool liquidity:", liquidity.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
