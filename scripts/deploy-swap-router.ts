import { ethers } from "hardhat";
import "@nomiclabs/hardhat-waffle";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying SwapRouter with account:", deployer.address);

  const factoryAddress = "0xC2EdBdd3394dA769De72986d06b0C28Ba991341d";
  const wethAddress = "0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be";

  const SwapRouter = await ethers.getContractFactory("SwapRouter");
  const swapRouter = await SwapRouter.deploy(factoryAddress, wethAddress);
  await swapRouter.deployed();

  console.log("SwapRouter deployed to:", swapRouter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
