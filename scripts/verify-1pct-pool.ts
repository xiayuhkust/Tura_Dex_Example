import { ethers } from "hardhat";

async function main() {
  const ADDRESSES = {
    POOL: '0x418Dc01d1C1D861edb171B804ec0227cB6beDc78',
    TT1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
    TT2: '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122'
  };

  // Get pool contract
  const pool = await ethers.getContractAt("contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool", ADDRESSES.POOL);
  
  // Get pool details
  const token0 = await pool.token0();
  const token1 = await pool.token1();
  const fee = await pool.fee();
  const tickSpacing = await pool.tickSpacing();

  // Get token contracts
  const tt1 = await ethers.getContractAt("contracts/interfaces/IERC20Minimal.sol:IERC20Minimal", ADDRESSES.TT1);
  const tt2 = await ethers.getContractAt("contracts/interfaces/IERC20Minimal.sol:IERC20Minimal", ADDRESSES.TT2);

  // Get owner account
  const [owner] = await ethers.getSigners();
  console.log("Using owner account:", owner.address);

  // Check token balances
  const tt1Balance = await tt1.balanceOf(owner.address);
  const tt2Balance = await tt2.balanceOf(owner.address);

  console.log("\nPool details:");
  console.log("- Token0:", token0);
  console.log("- Token1:", token1);
  console.log("- Fee:", fee.toString());
  console.log("- TickSpacing:", tickSpacing);

  console.log("\nToken balances:");
  console.log("- TT1:", ethers.utils.formatEther(tt1Balance));
  console.log("- TT2:", ethers.utils.formatEther(tt2Balance));

  // Verify token order
  console.log("\nToken order verification:");
  console.log("- TT1 address matches token0:", ADDRESSES.TT1.toLowerCase() === token0.toLowerCase());
  console.log("- TT2 address matches token1:", ADDRESSES.TT2.toLowerCase() === token1.toLowerCase());

  // Verify fee
  console.log("\nFee verification:");
  console.log("- Fee is 1%:", fee.toString() === "10000");
  console.log("- TickSpacing matches 1% fee:", tickSpacing.toString() === "200");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
