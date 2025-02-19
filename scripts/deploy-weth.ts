import { ethers } from "hardhat";
import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

async function main() {
  console.log("Deploying TuraWETH contract...");

  const [deployer] = await ethers.getSigners() as HardhatEthersSigner[];
  const TuraWETH = await ethers.getContractFactory("TuraWETH", deployer);
  const weth = await TuraWETH.deploy();
  await weth.waitForDeployment();

  const wethAddress = await weth.getAddress();
  console.log("TuraWETH deployed to:", wethAddress);
  console.log("Deployed by:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
