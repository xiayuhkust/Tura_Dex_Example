import { ethers } from "hardhat";
import "@nomiclabs/hardhat-waffle";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying NonfungibleTokenPositionDescriptor with account:", deployer.address);

  const weth9 = "0xc8F7d7989a409472945b00177396f4e9b8601DF3";
  const nativeCurrencyLabelBytes = ethers.utils.formatBytes32String("TURA");

  const PositionDescriptor = await ethers.getContractFactory("NonfungibleTokenPositionDescriptor");
  const positionDescriptor = await PositionDescriptor.deploy(weth9, nativeCurrencyLabelBytes);
  await positionDescriptor.deployed();

  console.log("NonfungibleTokenPositionDescriptor deployed to:", positionDescriptor.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
