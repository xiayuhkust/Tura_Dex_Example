import { ethers } from "hardhat";

async function main() {
  const ADDRESSES = {
    FACTORY: '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d',
    TT1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
    TT2: '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122'
  };

  // Get factory contract
  const factory = await ethers.getContractAt("contracts/interfaces/IUniswapV3Factory.sol:IUniswapV3Factory", ADDRESSES.FACTORY);
  
  // Check if pool exists
  const pool = await factory.getPool(ADDRESSES.TT1, ADDRESSES.TT2, 3000);
  console.log("Pool address:", pool);
  console.log("Pool exists:", pool !== ethers.constants.AddressZero);

  // Try with tokens in reverse order
  const poolReverse = await factory.getPool(ADDRESSES.TT2, ADDRESSES.TT1, 3000);
  console.log("Pool address (reverse order):", poolReverse);
  console.log("Pool exists (reverse order):", poolReverse !== ethers.constants.AddressZero);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
