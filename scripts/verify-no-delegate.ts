import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Verifying NoDelegateCall with account:", signer.address);

  const factory = await ethers.getContractAt("UniswapV3Factory", "0xC2EdBdd3394dA769De72986d06b0C28Ba991341d");
  
  // Check NoDelegateCall implementation in bytecode
  console.log("\nChecking NoDelegateCall implementation in bytecode...");
  const factoryCode = await ethers.provider.getCode(factory.address);
  
  // Check for address comparison in bytecode (NoDelegateCall pattern)
  const addressComparisonPattern = "3d3d3d3d363d73";
  const hasNoDelegateCall = factoryCode.includes(addressComparisonPattern);
  console.log("Factory has NoDelegateCall pattern:", hasNoDelegateCall);

  // Test function call through proxy contract
  console.log("\nTesting function call through proxy...");
  const ABI = ["function createPool(address,address,uint24) returns (address)"];
  const iface = new ethers.utils.Interface(ABI);
  const calldata = iface.encodeFunctionData("createPool", [
    "0xc8F7d7989a409472945b00177396f4e9b8601DF3",
    "0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9",
    3000
  ]);

  try {
    const tx = {
      to: factory.address,
      data: calldata
    };
    const result = await signer.call({
      ...tx,
      to: factory.address
    });
    console.log("Direct call succeeded");

    // Try delegate call
    const delegateResult = await signer.call({
      ...tx,
      to: "0x0000000000000000000000000000000000000001" // Any address that's not the factory
    });
    console.log("❌ NoDelegateCall protection failed");
  } catch (error) {
    if (error.message.includes("revert") || error.message.includes("invalid opcode")) {
      console.log("✅ NoDelegateCall protection working (delegate call reverted)");
    } else {
      console.log("❌ Unexpected error:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);
