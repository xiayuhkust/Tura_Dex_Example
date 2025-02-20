import { ethers } from "hardhat";
import "@nomiclabs/hardhat-waffle";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Verifying contracts with account:", deployer.address);

  // Contract addresses
  const contracts = {
    weth: "0xc8F7d7989a409472945b00177396f4e9b8601DF3",
    factory: "0xC2EdBdd3394dA769De72986d06b0C28Ba991341d",
    nftDescriptor: "0x0297b528164dE6eeB0543DED5CBC8048eaf7c1D2",
    positionDescriptor: "0xF6F59FF948F589bcA48295Be1Df1fD202FE5EeD8",
    positionManager: "0x90B834B3027Cd62c76FdAF1c22B21D1D8a2Cc965",
    swapRouter: "0xAC15BD2b9CfC37AA3a2aC78CD41a7abF33476F19"
  };

  // Verify bytecode exists
  for (const [name, address] of Object.entries(contracts)) {
    const code = await ethers.provider.getCode(address);
    console.log(`\n${name} contract at ${address}:`);
    console.log(`Has bytecode: ${code.length > 2}`);
  }

  // Verify WETH
  const wethAbi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function deposit() payable",
    "function withdraw(uint256)"
  ];
  const weth = await ethers.getContractAt(wethAbi, contracts.weth);
  console.log("\nVerifying WETH:");
  try {
    console.log("Name:", await weth.name());
    console.log("Symbol:", await weth.symbol());
    console.log("Decimals:", await weth.decimals());
  } catch (error) {
    console.log("Error reading WETH details:", error.message);
  }

  // Verify Factory
  const factoryAbi = [
    "function owner() view returns (address)",
    "function feeAmountTickSpacing(uint24) view returns (int24)",
    "function getPool(address,address,uint24) view returns (address)"
  ];
  const factory = await ethers.getContractAt(factoryAbi, contracts.factory);
  console.log("\nVerifying Factory:");
  try {
    console.log("Owner:", await factory.owner());
    console.log("Fee tier 500 tick spacing:", await factory.feeAmountTickSpacing(500));
    console.log("Fee tier 3000 tick spacing:", await factory.feeAmountTickSpacing(3000));
    console.log("Fee tier 10000 tick spacing:", await factory.feeAmountTickSpacing(10000));
  } catch (error) {
    console.log("Error reading Factory details:", error.message);
  }
  
  // Verify SwapRouter dependencies
  const swapRouterAbi = [
    "function factory() view returns (address)",
    "function WETH9() view returns (address)"
  ];
  const swapRouter = await ethers.getContractAt(swapRouterAbi, contracts.swapRouter);
  console.log("\nVerifying SwapRouter dependencies:");
  try {
    console.log("Factory:", await swapRouter.factory());
    console.log("WETH9:", await swapRouter.WETH9());
  } catch (error) {
    console.log("Error reading SwapRouter details:", error.message);
  }

  // Verify PositionManager dependencies
  const positionManagerAbi = [
    "function factory() view returns (address)",
    "function WETH9() view returns (address)",
    "function tokenUri() view returns (address)"
  ];
  const positionManager = await ethers.getContractAt(positionManagerAbi, contracts.positionManager);
  console.log("\nVerifying PositionManager dependencies:");
  try {
    console.log("Factory:", await positionManager.factory());
    console.log("WETH9:", await positionManager.WETH9());
    console.log("Token Descriptor:", await positionManager.tokenDescriptor());
  } catch (error) {
    console.log("Error reading PositionManager details:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
