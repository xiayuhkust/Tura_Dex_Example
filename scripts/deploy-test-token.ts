import { ethers, network } from "hardhat";

async function main() {
  console.log("Deploying Test Tokens...");

  const TestToken = await ethers.getContractFactory("TestToken");
  
  const token1 = await TestToken.deploy("Test Token 1", "TT1");
  await token1.waitForDeployment();
  const token1Address = await token1.getAddress();
  console.log("Test Token 1 deployed to:", token1Address);

  const token2 = await TestToken.deploy("Test Token 2", "TT2");
  await token2.waitForDeployment();
  const token2Address = await token2.getAddress();
  console.log("Test Token 2 deployed to:", token2Address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
