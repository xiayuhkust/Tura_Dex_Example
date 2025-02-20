import { ethers } from "hardhat";
import "@nomiclabs/hardhat-waffle";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // First deploy NFTDescriptor library
  console.log("Deploying NFTDescriptor library...");
  const NFTDescriptor = await ethers.getContractFactory("NFTDescriptor");
  const nftDescriptor = await NFTDescriptor.deploy();
  await nftDescriptor.deployed();
  console.log("NFTDescriptor deployed to:", nftDescriptor.address);

  // Deploy NonfungibleTokenPositionDescriptor with library linking
  console.log("Deploying NonfungibleTokenPositionDescriptor...");
  const weth9 = "0xc8F7d7989a409472945b00177396f4e9b8601DF3";
  const nativeCurrencyLabelBytes = ethers.utils.formatBytes32String("TURA");

  const PositionDescriptor = await ethers.getContractFactory("NonfungibleTokenPositionDescriptor", {
    libraries: {
      NFTDescriptor: nftDescriptor.address,
    },
  });
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
