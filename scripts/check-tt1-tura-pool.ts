import { ethers } from "hardhat";

async function main() {
  console.log("Checking TT1/TURA pool...");

  const ADDRESSES = {
    FACTORY: '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d',
    TT1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
    WETH: '0xc8F7d7989a409472945b00177396f4e9b8601DF3'
  };

  // Get factory contract
  const factory = await ethers.getContractAt("contracts/interfaces/IUniswapV3Factory.sol:IUniswapV3Factory", ADDRESSES.FACTORY);
  
  // Get pool address
  const pool = await factory.getPool(ADDRESSES.TT1, ADDRESSES.WETH, 3000);
  console.log("Pool address:", pool);
  console.log("Pool exists:", pool !== ethers.constants.AddressZero);

  if (pool !== ethers.constants.AddressZero) {
    // Get pool details
    const poolContract = await ethers.getContractAt("contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool", pool);
    const token0 = await poolContract.token0();
    const token1 = await poolContract.token1();
    const fee = await poolContract.fee();
    const liquidity = await poolContract.liquidity();
    const slot0 = await poolContract.slot0();

    console.log("\nPool details:");
    console.log("- Token0:", token0);
    console.log("- Token1:", token1);
    console.log("- Fee:", fee);
    console.log("- Liquidity:", liquidity.toString());
    console.log("- Initialized:", !slot0.sqrtPriceX96.eq(0));
    console.log("- Current sqrt price:", slot0.sqrtPriceX96.toString());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
