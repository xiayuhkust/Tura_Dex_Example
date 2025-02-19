const hre = require("hardhat");

async function main() {
  console.log("Verifying TuraWETH contract...");

  const [owner] = await hre.ethers.getSigners();
  console.log("Testing with account:", owner.address);

  // Get contract instance
  const TuraWETH = await hre.ethers.getContractFactory("contracts/backup/core/TuraWETH.sol:TuraWETH");
  const weth = await TuraWETH.attach("0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be");

  try {
    // Check if contract exists
    const code = await hre.ethers.provider.getCode("0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be");
    console.log("\nContract deployed:", code !== "0x");

    if (code === "0x") {
      console.log("No contract found at the specified address. Need to deploy new contract.");
      return;
    }

    // Try to get name and symbol
    const name = await weth.name();
    const symbol = await weth.symbol();
    console.log(`Contract name: ${name}`);
    console.log(`Contract symbol: ${symbol}`);
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
