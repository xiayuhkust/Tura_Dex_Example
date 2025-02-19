import { ethers } from "hardhat";

async function main() {
  console.log("Initializing TT1/TURA pool (v5)...");

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

  // Check pool state
  const slot0 = await poolContract.slot0();
  console.log("\nPool state:");
  console.log("- Initialized:", !slot0.sqrtPriceX96.eq(0));
  console.log("- Current sqrt price:", slot0.sqrtPriceX96.toString());
  console.log("- Current tick:", slot0.tick.toString());
  console.log("- Unlocked:", slot0.unlocked);

  // Use very small amounts
  const amount = ethers.utils.parseEther("0.1"); // 0.1 token
  
  console.log("\nAmount to add:", ethers.utils.formatEther(amount));

  // Approve tokens
  await tt1.approve(ADDRESSES.POOL, amount);
  await weth.approve(ADDRESSES.POOL, amount);
  console.log("\nTokens approved for pool");

  // Add initial liquidity with very small range
  const tickSpacing = 60; // 0.3% fee tier
  const currentTick = Math.floor(slot0.tick / tickSpacing) * tickSpacing;
  const tickLower = currentTick - tickSpacing;
  const tickUpper = currentTick + tickSpacing;

  console.log("\nTick range:");
  console.log("- Lower:", tickLower);
  console.log("- Current:", currentTick);
  console.log("- Upper:", tickUpper);

  try {
    // Encode callback data with both tokens and amounts
    const callbackData = ethers.utils.defaultAbiCoder.encode(
      ['address', 'address', 'address'],
      [owner.address, ADDRESSES.TT1, ADDRESSES.WETH]
    );

    const mintTx = await poolContract.mint(
      owner.address,
      tickLower,
      tickUpper,
      amount,
      callbackData,
      { gasLimit: 2000000 }
    );
    const receipt = await mintTx.wait();
    console.log("\nLiquidity added successfully");
    console.log("Transaction hash:", receipt.transactionHash);
  } catch (error) {
    console.error("\nError details:", error);
    if (error.message && error.message.includes('LOK')) {
      console.error("Pool is locked. This usually means another transaction is in progress.");
      console.error("Please wait a few blocks and try again.");
    } else {
      console.error("Failed to add liquidity. See error details above.");
    }
    process.exit(1);
  }

  // Verify final state
  const liquidity = await poolContract.liquidity();
  const finalSlot0 = await poolContract.slot0();
  console.log("\nFinal pool state:");
  console.log("- Liquidity:", liquidity.toString());
  console.log("- Sqrt price:", finalSlot0.sqrtPriceX96.toString());
  console.log("- Current tick:", finalSlot0.tick.toString());
  console.log("- Unlocked:", finalSlot0.unlocked);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
