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
  const weth = await ethers.getContractAt("IWETH9", contracts.weth);
  console.log("\nVerifying WETH:");
  console.log("Name:", await weth.name());
  console.log("Symbol:", await weth.symbol());
  console.log("Decimals:", await weth.decimals());

  // Verify Factory
  const factory = await ethers.getContractAt("IUniswapV3Factory", contracts.factory);
  console.log("\nVerifying Factory:");
  console.log("Owner:", await factory.owner());
  
  // Verify SwapRouter dependencies
  const swapRouter = await ethers.getContractAt("SwapRouter", contracts.swapRouter);
  console.log("\nVerifying SwapRouter dependencies:");
  console.log("Factory:", await swapRouter.factory());
  console.log("WETH9:", await swapRouter.WETH9());

  // Verify PositionManager dependencies
  const positionManager = await ethers.getContractAt("NonfungiblePositionManager", contracts.positionManager);
  console.log("\nVerifying PositionManager dependencies:");
  console.log("Factory:", await positionManager.factory());
  console.log("WETH9:", await positionManager.WETH9());
  console.log("Token Descriptor:", await positionManager.tokenDescriptor());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
