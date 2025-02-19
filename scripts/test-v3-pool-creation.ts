import { ethers } from "hardhat";
import { ContractReceipt, Event } from "@ethersproject/contracts";

async function main() {
  console.log("Testing pool creation with V3 factory...");

  const ADDRESSES = {
    FACTORY: '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d',
    TT1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
    TT2: '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122'
  };

  // Get factory contract
  const factory = await ethers.getContractAt("IUniswapV3Factory", ADDRESSES.FACTORY);
  
  // Get token contracts
  const tt1 = await ethers.getContractAt("IERC20Minimal", ADDRESSES.TT1);
  const tt2 = await ethers.getContractAt("IERC20Minimal", ADDRESSES.TT2);

  // Check initial balances
  const [owner] = await ethers.getSigners();
  const initialTT1Balance = await tt1.balanceOf(owner.address);
  const initialTT2Balance = await tt2.balanceOf(owner.address);
  console.log("Initial TT1 balance:", ethers.utils.formatEther(initialTT1Balance));
  console.log("Initial TT2 balance:", ethers.utils.formatEther(initialTT2Balance));

  // Create pool with 0.3% fee
  console.log("Creating pool with 0.3% fee...");
  const tx = await factory.createPool(ADDRESSES.TT1, ADDRESSES.TT2, 3000);
  console.log("Transaction hash:", tx.hash);

  // Wait for transaction and get event
  const receipt = await tx.wait();
  const event = receipt.events?.find((e: Event) => e.event === "PoolCreated");
  
  if (!event) {
    throw new Error("PoolCreated event not found");
  }

  console.log("Pool created successfully!");
  console.log("Event data:", {
    token0: event.args.token0,
    token1: event.args.token1,
    fee: event.args.fee,
    tickSpacing: event.args.tickSpacing,
    pool: event.args.pool
  });

  // Check final balances
  const finalTT1Balance = await tt1.balanceOf(owner.address);
  const finalTT2Balance = await tt2.balanceOf(owner.address);
  console.log("Final TT1 balance:", ethers.utils.formatEther(finalTT1Balance));
  console.log("Final TT2 balance:", ethers.utils.formatEther(finalTT2Balance));
  console.log("TT1 balance change:", ethers.utils.formatEther(finalTT1Balance.sub(initialTT1Balance)));
  console.log("TT2 balance change:", ethers.utils.formatEther(finalTT2Balance.sub(initialTT2Balance)));

  return {
    poolAddress: event.args.pool,
    token0: event.args.token0,
    token1: event.args.token1,
    fee: event.args.fee,
    tickSpacing: event.args.tickSpacing
  };
}

main()
  .then((result) => {
    console.log("Test completed successfully:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
