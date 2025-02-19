import { ethers } from "hardhat";
import { ContractReceipt, Event } from "@ethersproject/contracts";

async function main() {
  console.log("Testing TT1/TURA pool creation...");

  const ADDRESSES = {
    FACTORY: '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d',
    TT1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
    WETH: '0xc8F7d7989a409472945b00177396f4e9b8601DF3'
  };

  // Get factory contract
  const factory = await ethers.getContractAt("contracts/interfaces/IUniswapV3Factory.sol:IUniswapV3Factory", ADDRESSES.FACTORY);
  
  // Get token contracts
  const tt1 = await ethers.getContractAt("contracts/interfaces/IERC20Minimal.sol:IERC20Minimal", ADDRESSES.TT1);
  const weth = await ethers.getContractAt("contracts/interfaces/IERC20Minimal.sol:IERC20Minimal", ADDRESSES.WETH);

  // Get owner account
  const [owner] = await ethers.getSigners();
  console.log("Using owner account:", owner.address);

  // Check initial balances
  const initialTT1Balance = await tt1.balanceOf(owner.address);
  const initialWETHBalance = await weth.balanceOf(owner.address);
  console.log("Initial TT1 balance:", ethers.utils.formatEther(initialTT1Balance));
  console.log("Initial WETH balance:", ethers.utils.formatEther(initialWETHBalance));

  // Create pool with 0.3% fee
  console.log("Creating pool with 0.3% fee...");
  const tx = await factory.createPool(ADDRESSES.TT1, ADDRESSES.WETH, 3000);
  console.log("Transaction hash:", tx.hash);

  // Wait for transaction and get event
  const receipt = await tx.wait();
  const event = receipt.events?.find((e: Event) => e.event === "PoolCreated");
  
  if (!event) {
    throw new Error("PoolCreated event not found");
  }

  const poolAddress = event.args.pool;
  console.log("Pool created at:", poolAddress);

  // Initialize pool with sqrt price
  const poolContract = await ethers.getContractAt("contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool", poolAddress);
  const sqrtPriceX96 = ethers.BigNumber.from('1').shl(96); // Initial price of 1
  await poolContract.initialize(sqrtPriceX96);
  console.log("Pool initialized with sqrt price:", sqrtPriceX96.toString());

  // Approve tokens
  const amount = ethers.utils.parseEther("1000");
  await tt1.approve(poolAddress, amount);
  await weth.approve(poolAddress, amount);
  console.log("Tokens approved for pool");

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
  console.log("Liquidity added successfully");

  // Check final balances
  const finalTT1Balance = await tt1.balanceOf(owner.address);
  const finalWETHBalance = await weth.balanceOf(owner.address);
  console.log("\nFinal balances:");
  console.log("TT1:", ethers.utils.formatEther(finalTT1Balance));
  console.log("WETH:", ethers.utils.formatEther(finalWETHBalance));
  console.log("\nBalance changes:");
  console.log("TT1:", ethers.utils.formatEther(finalTT1Balance.sub(initialTT1Balance)));
  console.log("WETH:", ethers.utils.formatEther(finalWETHBalance.sub(initialWETHBalance)));

  return {
    poolAddress,
    token0: event.args.token0,
    token1: event.args.token1,
    fee: event.args.fee,
    tickSpacing: event.args.tickSpacing
  };
}

main()
  .then((result) => {
    console.log("\nTest completed successfully:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
