import { ethers } from "hardhat";
import { ContractReceipt, Event } from "@ethersproject/contracts";

async function main() {
  console.log("Testing pool creation with V3 factory (1% fee)...");

  const ADDRESSES = {
    FACTORY: '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d',
    TT1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
    TT2: '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122'
  };

  // Get factory contract
  const factory = await ethers.getContractAt("contracts/interfaces/IUniswapV3Factory.sol:IUniswapV3Factory", ADDRESSES.FACTORY);
  
  // Check if pool exists
  const existingPool = await factory.getPool(ADDRESSES.TT1, ADDRESSES.TT2, 10000);
  console.log("Existing pool (1% fee):", existingPool);
  console.log("Pool exists:", existingPool !== ethers.constants.AddressZero);

  if (existingPool === ethers.constants.AddressZero) {
    // Create pool with 1% fee
    console.log("Creating pool with 1% fee...");
    const tx = await factory.createPool(ADDRESSES.TT1, ADDRESSES.TT2, 10000);
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

    return {
      poolAddress: event.args.pool,
      token0: event.args.token0,
      token1: event.args.token1,
      fee: event.args.fee,
      tickSpacing: event.args.tickSpacing
    };
  } else {
    // Get pool details if it exists
    const pool = await ethers.getContractAt("contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool", existingPool);
    const token0 = await pool.token0();
    const token1 = await pool.token1();
    const fee = await pool.fee();
    const tickSpacing = await pool.tickSpacing();

    console.log("Existing pool details:");
    console.log("- Token0:", token0);
    console.log("- Token1:", token1);
    console.log("- Fee:", fee);
    console.log("- TickSpacing:", tickSpacing);

    return {
      poolAddress: existingPool,
      token0,
      token1,
      fee,
      tickSpacing
    };
  }
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
