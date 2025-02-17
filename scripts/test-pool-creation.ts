import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Contract addresses
  const FACTORY_ADDRESS = "0x511CE2380a70bE66FAf44a5baaBf11E92D654905";
  const WETH_ADDRESS = "0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be";
  const TEST_TOKEN_ADDRESS = "0xf7430841c1917Fee24B04dBbd0b809F36E5Ad716";

  // Connect to contracts
  const factory = await ethers.getContractAt("TuraFactory", FACTORY_ADDRESS);
  const weth = await ethers.getContractAt("WETH9", WETH_ADDRESS);
  const testToken = await ethers.getContractAt("TestToken", TEST_TOKEN_ADDRESS);

  // Test different fee tiers
  const FEE_TIERS = [3000, 5000, 10000]; // 0.3%, 0.5%, 1%
  for (const fee of FEE_TIERS) {
    console.log(`\nTesting pool creation with ${fee/10000}% fee`);
    
    // Create pool if it doesn't exist
    let poolAddress = await factory.getPool(WETH_ADDRESS, TEST_TOKEN_ADDRESS, fee);
    if (poolAddress === ethers.constants.AddressZero) {
      console.log("Creating new pool...");
      const tx = await factory.createPool(WETH_ADDRESS, TEST_TOKEN_ADDRESS, fee);
      await tx.wait();
      poolAddress = await factory.getPool(WETH_ADDRESS, TEST_TOKEN_ADDRESS, fee);
      console.log("Pool created at:", poolAddress);
    } else {
      console.log("Pool exists at:", poolAddress);
    }

    // Initialize pool if needed
    const pool = await ethers.getContractAt("TuraPool", poolAddress);
    const slot0 = await pool.slot0();
    if (slot0.sqrtPriceX96.eq(0)) {
      console.log("Initializing pool...");
      const initPrice = ethers.utils.parseUnits("1", 18); // 1:1 price
      await pool.initialize(initPrice);
      console.log("Pool initialized");
    }

    // Add liquidity
    console.log("\nTesting liquidity provision...");
    const amount = ethers.utils.parseEther("1");
    
    // Approve tokens
    await weth.deposit({ value: amount });
    await weth.approve(poolAddress, amount);
    await testToken.approve(poolAddress, amount);

    // Add liquidity in different ranges
    const TICK_RANGES = [
      { lower: -887272, upper: 887272 }, // Full range
      { lower: -443636, upper: 443636 }, // Half range
      { lower: -221818, upper: 221818 }  // Quarter range
    ];

    for (const range of TICK_RANGES) {
      console.log(`\nAdding liquidity in range [${range.lower}, ${range.upper}]`);
      await pool.mint(
        deployer.address,
        range.lower,
        range.upper,
        amount.div(3) // Split amount across ranges
      );
      
      const positionKey = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['address', 'int24', 'int24'],
          [deployer.address, range.lower, range.upper]
        )
      );
      const position = await pool.positions(positionKey);
      console.log("Position liquidity:", position.liquidity.toString());
    }
  }

  console.log("\nPool creation and liquidity provision tests completed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
