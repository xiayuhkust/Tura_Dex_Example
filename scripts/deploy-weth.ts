import { ethers } from "hardhat";

async function main() {
  console.log("Deploying TuraWETH contract...");

  const TuraWETH = await ethers.getContractFactory("TuraWETH");
  const weth = await TuraWETH.deploy();
  await weth.waitForDeployment();

  const wethAddress = await weth.getAddress();
  console.log("TuraWETH deployed to:", wethAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
