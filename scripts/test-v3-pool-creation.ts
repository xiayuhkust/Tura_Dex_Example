import { ethers } from "hardhat";
import { ContractReceipt, Event } from "@ethersproject/contracts";

async function main() {
  console.log("Testing pool creation with V3 factory...");

  const OWNER_ADDRESS = "0x08Bb6eA809A2d6c13D57166Fa3ede48C0ae9a70e";
  const ADDRESSES = {
    FACTORY: '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d',
    TT1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
    TT2: '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122'
  };

  // Get factory contract
  const factory = await ethers.getContractAt("contracts/interfaces/IUniswapV3Factory.sol:IUniswapV3Factory", ADDRESSES.FACTORY);
  
  // Get token contracts
  const tt1 = await ethers.getContractAt("contracts/interfaces/IERC20Minimal.sol:IERC20Minimal", ADDRESSES.TT1);
  const tt2 = await ethers.getContractAt("contracts/interfaces/IERC20Minimal.sol:IERC20Minimal", ADDRESSES.TT2);

  // Get owner account
  const [owner] = await ethers.getSigners();
  console.log("Using owner account:", owner.address);

  // Check initial balances
  const initialTT1Balance = await tt1.balanceOf(OWNER_ADDRESS);
  const initialTT2Balance = await tt2.balanceOf(OWNER_ADDRESS);
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
  const finalTT1Balance = await tt1.balanceOf(OWNER_ADDRESS);
  const finalTT2Balance = await tt2.balanceOf(OWNER_ADDRESS);
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
