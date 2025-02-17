import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

async function main() {
  console.log("Deploying Pool to Tura network...");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (chainId: ${network.chainId})`);
  if (network.chainId !== 1337) {
    throw new Error("Must be deployed to Tura network with chainId 1337");
  }

  // Get the factory address from previous deployment
  const factoryAddress = process.env.FACTORY_ADDRESS;
  if (!factoryAddress) {
    throw new Error("FACTORY_ADDRESS environment variable not set");
  }
  console.log("Factory address:", factoryAddress);

  // Connect to factory
  const factory = await ethers.getContractAt("UniswapV3Factory", factoryAddress);
  console.log("Connected to factory");

  // Deploy test tokens
  const TokenFactory = await ethers.getContractFactory("TestERC20");
  console.log("Deploying test tokens...");

  const token0 = await TokenFactory.deploy("Test Token 0", "TT0", 18);
  await token0.deployed();
  console.log("Token0 deployed to:", token0.address);

  const token1 = await TokenFactory.deploy("Test Token 1", "TT1", 18);
  await token1.deployed();
  console.log("Token1 deployed to:", token1.address);

  // Create pool with 0.3% fee tier
  console.log("Creating pool...");
  const FEE = 3000; // 0.3%
  const createPoolTx = await factory.createPool(token0.address, token1.address, FEE);
  await createPoolTx.wait();

  // Get pool address
  const poolAddress = await factory.getPool(token0.address, token1.address, FEE);
  console.log("Pool deployed to:", poolAddress);

  // Initialize pool with 1:1 price
  const pool = await ethers.getContractAt("UniswapV3Pool", poolAddress);
  const initTx = await pool.initialize(ethers.BigNumber.from("79228162514264337593543950336")); // 1.0 in Q96
  await initTx.wait();
  console.log("Pool initialized");

  // Verify deployment
  const slot0 = await pool.slot0();
  console.log("Pool price initialized:", slot0.sqrtPriceX96.toString());
  console.log("Pool tick:", slot0.tick.toString());

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("Network:", network.name);
  console.log("Factory:", factoryAddress);
  console.log("Token0:", token0.address);
  console.log("Token1:", token1.address);
  console.log("Pool:", poolAddress);
  console.log("Fee Tier:", FEE);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
