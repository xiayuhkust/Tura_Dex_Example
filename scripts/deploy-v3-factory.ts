import { ethers } from "hardhat";

async function main() {
  console.log("Deploying UniswapV3Factory...");

  // Deploy factory
  const UniswapV3Factory = await ethers.getContractFactory("contracts/UniswapV3Factory.sol:UniswapV3Factory");
  const factory = await UniswapV3Factory.deploy();
  await factory.deployed();
  console.log("UniswapV3Factory deployed to:", factory.address);

  // Verify deployment
  const owner = await factory.owner();
  console.log("Factory owner:", owner);

  // Verify fee tiers
  const fees = [500, 3000, 10000];
  for (const fee of fees) {
    const tickSpacing = await factory.feeAmountTickSpacing(fee);
    console.log(`Fee tier ${fee} tick spacing:`, tickSpacing.toString());
  }

  return {
    address: factory.address,
    owner: owner
  };
}

main()
  .then((result) => {
    console.log("Deployment successful:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
