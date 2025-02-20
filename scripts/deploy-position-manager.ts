import { ethers } from "hardhat";
import "@nomiclabs/hardhat-waffle";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying NonfungiblePositionManager with account:", deployer.address);

  const factory = "0xC2EdBdd3394dA769De72986d06b0C28Ba991341d";
  const weth9 = "0xc8F7d7989a409472945b00177396f4e9b8601DF3";
  const descriptor = "0xF6F59FF948F589bcA48295Be1Df1fD202FE5EeD8";

  const PositionManager = await ethers.getContractFactory("NonfungiblePositionManager");
  const positionManager = await PositionManager.deploy(factory, weth9, descriptor);
  await positionManager.deployed();

  console.log("NonfungiblePositionManager deployed to:", positionManager.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
