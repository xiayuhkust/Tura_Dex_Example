import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying peripheral contracts with account:", await deployer.getAddress());

  const factoryAddress = "0x511CE2380a70bE66FAf44a5baaBf11E92D654905";
  const weth9Address = "0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be";

  // Deploy SwapRouter
  console.log("Deploying SwapRouter...");
  const SwapRouter = await ethers.getContractFactory("SwapRouter");
  const router = await SwapRouter.deploy(factoryAddress, weth9Address);
  await router.deployed();
  const routerAddress = router.address;
  console.log("SwapRouter deployed to:", routerAddress);

  // Deploy NonfungiblePositionManager
  console.log("Deploying NonfungiblePositionManager...");
  const NonfungiblePositionManager = await ethers.getContractFactory("NonfungiblePositionManager");
  const nftManager = await NonfungiblePositionManager.deploy(factoryAddress, weth9Address);
  await nftManager.deployed();
  const nftManagerAddress = nftManager.address;
  console.log("NonfungiblePositionManager deployed to:", nftManagerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
