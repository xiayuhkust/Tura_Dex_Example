import hre from "hardhat";

async function main() {
  console.log("Deploying TuraWETH contract...");

  const [deployer] = await hre.ethers.getSigners();
  const TuraWETH = await hre.ethers.getContractFactory("TuraWETH");
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
