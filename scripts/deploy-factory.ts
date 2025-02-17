import { ethers, network } from "hardhat";

async function main() {
  console.log("Deploying TuraFactory contract...");

  const TuraFactory = await ethers.getContractFactory("TuraFactory");
  const factory = await TuraFactory.deploy();
  await factory.deployed();

  const factoryAddress = factory.address;
  console.log("TuraFactory deployed to:", factoryAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
