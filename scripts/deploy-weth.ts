import { ethers } from "hardhat";

async function main() {
  console.log("Deploying TuraWETH contract...");

  const [deployer] = await ethers.getSigners();
  const TuraWETH = await ethers.getContractFactory("TuraWETH");
  const weth = await TuraWETH.deploy();
  await weth.deployed();

  console.log("TuraWETH deployed to:", weth.address);
  console.log("Deployed by:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
