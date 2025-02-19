import { ethers } from "hardhat";

async function main() {
  console.log("Initializing TT1/TURA pool...");

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

  // Check initial balances
  const initialTT1Balance = await tt1.balanceOf(owner.address);
  const initialWETHBalance = await weth.balanceOf(owner.address);
  console.log("\nInitial balances:");
  console.log("TT1:", ethers.utils.formatEther(initialTT1Balance));
  console.log("WETH:", ethers.utils.formatEther(initialWETHBalance));

  // Get pool contract
  const poolContract = await ethers.getContractAt("contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool", ADDRESSES.POOL);

  // Initialize pool with sqrt price
  const sqrtPriceX96 = ethers.BigNumber.from('1').shl(96); // Initial price of 1
  await poolContract.initialize(sqrtPriceX96);
  console.log("\nPool initialized with sqrt price:", sqrtPriceX96.toString());

  // Approve tokens
  const amount = ethers.utils.parseEther("1000");
  await tt1.approve(ADDRESSES.POOL, amount);
  await weth.approve(ADDRESSES.POOL, amount);
  console.log("\nTokens approved for pool");

  // Add initial liquidity
  const tickSpacing = 60; // 0.3% fee tier
  const tickLower = -887272 / tickSpacing * tickSpacing;
  const tickUpper = 887272 / tickSpacing * tickSpacing;

  await poolContract.mint(
    owner.address,
    tickLower,
    tickUpper,
    amount,
    '0x'
  );
  console.log("\nLiquidity added successfully");

  // Check final balances
  const finalTT1Balance = await tt1.balanceOf(owner.address);
  const finalWETHBalance = await weth.balanceOf(owner.address);
  console.log("\nFinal balances:");
  console.log("TT1:", ethers.utils.formatEther(finalTT1Balance));
  console.log("WETH:", ethers.utils.formatEther(finalWETHBalance));
  console.log("\nBalance changes:");
  console.log("TT1:", ethers.utils.formatEther(finalTT1Balance.sub(initialTT1Balance)));
  console.log("WETH:", ethers.utils.formatEther(finalWETHBalance.sub(initialWETHBalance)));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
