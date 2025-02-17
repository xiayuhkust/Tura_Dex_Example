import { ethers } from "hardhat";

async function main() {
  // Verify we're on the Tura network
  const network = await ethers.provider.getNetwork();
  console.log(`Deploying to network: ${network.name} (chainId: ${network.chainId})`);
  if (network.chainId !== 1337) {
    throw new Error("Must be deployed to Tura network with chainId 1337");
  }
  console.log("Deploying Factory contract to Tura network...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", await deployer.getAddress());
  
  const Factory = await ethers.getContractFactory("UniswapV3Factory");
  const factory = await Factory.deploy();
  await factory.deployed();
  
  console.log("Factory contract deployed to:", factory.address);
  
  // Verify basic functionality
  const owner = await factory.owner();
  console.log("Factory owner set to:", owner);
  
  // Verify fee configurations
  const fee500 = await factory.feeAmountTickSpacing(500);
  const fee3000 = await factory.feeAmountTickSpacing(3000);
  const fee10000 = await factory.feeAmountTickSpacing(10000);
  
  console.log("Fee configurations verified:");
  console.log("- Fee 0.05%:", fee500.toString());
  console.log("- Fee 0.3%:", fee3000.toString());
  console.log("- Fee 1%:", fee10000.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
