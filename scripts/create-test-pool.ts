import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Creating test pool with account:", deployer.address);

  const factory = await ethers.getContractAt("UniswapV3Factory", "0xC2EdBdd3394dA769De72986d06b0C28Ba991341d");
  const weth = "0xc8F7d7989a409472945b00177396f4e9b8601DF3";
  const tt1 = "0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9";
  const fee = 3000; // 0.3%

  // Check if pool already exists
  const existingPool = await factory.getPool(weth, tt1, fee);
  if (existingPool !== ethers.constants.AddressZero) {
    console.log("Pool already exists at:", existingPool);
    return;
  }

  console.log("Creating new pool...");
  console.log("WETH:", weth);
  console.log("TestToken1:", tt1);
  console.log("Fee:", fee);

  const tx = await factory.createPool(weth, tt1, fee);
  console.log("Transaction hash:", tx.hash);
  await tx.wait();

  const poolAddress = await factory.getPool(weth, tt1, fee);
  console.log("New pool created at:", poolAddress);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
