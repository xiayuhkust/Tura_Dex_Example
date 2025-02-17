import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying peripheral contracts with account:", await deployer.getAddress());

  const factoryAddress = "0x680AcAc3e49F959E0c20e6dcd3E653E83Db44aE3";
  const weth9Address = "0xD1BD923c4a999E25Bd73e6689476f18214ae76f4";

  // Deploy SwapRouter
  console.log("Deploying SwapRouter...");
  const SwapRouter = await ethers.getContractFactory("contracts/backup/periphery/SwapRouter.sol:SwapRouter");
  const router = await SwapRouter.deploy(factoryAddress, weth9Address);
  await router.deployed();
  const routerAddress = router.address;
  console.log("SwapRouter deployed to:", routerAddress);

  // Deploy NonfungiblePositionManager
  console.log("Deploying NonfungiblePositionManager...");
  const NonfungiblePositionManager = await ethers.getContractFactory("contracts/backup/periphery/NonfungiblePositionManager.sol:NonfungiblePositionManager");
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
