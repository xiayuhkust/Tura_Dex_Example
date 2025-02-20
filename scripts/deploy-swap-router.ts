import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "ethers";

async function main() {
  const hre = require("hardhat");
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying SwapRouter with account:", deployer.address);

  const factoryAddress = "0xC2EdBdd3394dA769De72986d06b0C28Ba991341d";
  const wethAddress = "0x981Ad9e1565bb8325c9C9bBf80758529E7C50994";

  const SwapRouter = await hre.ethers.getContractFactory("SwapRouter");
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
