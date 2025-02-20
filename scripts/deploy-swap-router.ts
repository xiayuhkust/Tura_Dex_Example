import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "ethers";

async function main() {
  const hre = require("hardhat");
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Please set PRIVATE_KEY in environment");
  }
  const deployer = new hre.ethers.Wallet(process.env.PRIVATE_KEY, hre.ethers.provider);
  console.log("Deploying SwapRouter with account:", deployer.address);

  const factoryAddress = "0xC2EdBdd3394dA769De72986d06b0C28Ba991341d";
  const wethAddress = "0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be";

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
