import { ethers, network } from "hardhat";

async function main() {
  console.log("Deploying WETH9 contract...");

  const WETH9 = await ethers.getContractFactory("WETH9");
  const weth = await WETH9.deploy();
  await weth.deployed();

  const wethAddress = weth.address;
  console.log("WETH9 deployed to:", wethAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
