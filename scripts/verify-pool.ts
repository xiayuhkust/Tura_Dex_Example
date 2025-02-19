import { ethers } from "hardhat";

async function main() {
  const ADDRESSES = {
    FACTORY: '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d',
    TT1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
    TT2: '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122',
    POOL: '0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347'
  };

  // Get pool contract
  const pool = await ethers.getContractAt("contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool", ADDRESSES.POOL);
  
  // Get pool details
  const token0 = await pool.token0();
  const token1 = await pool.token1();
  const fee = await pool.fee();
  const tickSpacing = await pool.tickSpacing();

  console.log("Pool details:");
  console.log("- Token0:", token0);
  console.log("- Token1:", token1);
  console.log("- Fee:", fee);
  console.log("- TickSpacing:", tickSpacing);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
