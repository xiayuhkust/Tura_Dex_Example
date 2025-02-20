import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Verifying NoDelegateCall with account:", signer.address);

  const factory = await ethers.getContractAt("UniswapV3Factory", "0xC2EdBdd3394dA769De72986d06b0C28Ba991341d");
  
  // Deploy MinimalProxy
  console.log("\nDeploying MinimalProxy...");
  const MinimalProxy = await ethers.getContractFactory("MinimalProxy");
  const proxyBytecode = `0x363d3d373d3d3d363d73${factory.address.slice(2)}5af43d82803e903d91602b57fd5bf3`;
  const proxy = await MinimalProxy.deploy(proxyBytecode);
  await proxy.deployed();
  console.log("MinimalProxy deployed to:", proxy.address);
  
  // Test delegate call protection
  console.log("\nTesting NoDelegateCall protection...");
  try {
    const proxyFactory = await ethers.getContractAt("UniswapV3Factory", proxy.address);
    await proxyFactory.createPool(
      "0xc8F7d7989a409472945b00177396f4e9b8601DF3",
      "0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9",
      3000
    );
    console.log("❌ NoDelegateCall protection failed");
  } catch (error) {
    if (error.message.includes("Not current implementation")) {
      console.log("✅ NoDelegateCall protection working");
    } else {
      console.log("❌ Unexpected error:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);
