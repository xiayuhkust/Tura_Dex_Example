import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Contract addresses
  const FACTORY_ADDRESS = "0x511CE2380a70bE66FAf44a5baaBf11E92D654905";
  const WETH_ADDRESS = "0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be";
  const TEST_TOKEN_ADDRESS = "0xf7430841c1917Fee24B04dBbd0b809F36E5Ad716";
  const POOL_ADDRESS = "0x47cC776b736B5898de24011909dDe0E91e41f88E";

  // Connect to contracts
  const pool = await ethers.getContractAt("TuraPool", POOL_ADDRESS);
  const weth = await ethers.getContractAt("WETH9", WETH_ADDRESS);
  const testToken = await ethers.getContractAt("TestToken", TEST_TOKEN_ADDRESS);

  console.log("\nTesting pool operations...");

  // 1. Check current pool state
  const slot0 = await pool.slot0();
  console.log("Current price:", slot0.sqrtPriceX96.toString());
  console.log("Current tick:", slot0.tick.toString());

  // 2. Add liquidity in different ranges
  console.log("\nTesting liquidity provision in different ranges...");
  const amount = ethers.utils.parseEther("1");
  
  // Approve tokens
  await weth.deposit({ value: amount });
  await weth.approve(POOL_ADDRESS, amount);
  await testToken.approve(POOL_ADDRESS, amount);

  const TICK_RANGES = [
    { lower: -887272, upper: 887272, name: "Full range" },
    { lower: -443636, upper: 443636, name: "Half range" },
    { lower: -221818, upper: 221818, name: "Quarter range" }
  ];

  for (const range of TICK_RANGES) {
    console.log(`\nAdding liquidity in ${range.name} [${range.lower}, ${range.upper}]`);
    await pool.mint(
      deployer.address,
      range.lower,
      range.upper,
      amount.div(3)
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

  // 3. Test swaps
  console.log("\nTesting swaps...");
  const swapAmount = ethers.utils.parseEther("0.1");
  
  console.log("Performing token0 -> token1 swap");
  await pool.swap(
    true, // zeroForOne
    swapAmount,
    deployer.address
  );

  console.log("Performing token1 -> token0 swap");
  await pool.swap(
    false, // zeroForOne
    swapAmount,
    deployer.address
  );

  // 4. Check fees collected
  console.log("\nChecking fees collected...");
  for (const range of TICK_RANGES) {
    const positionKey = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['address', 'int24', 'int24'],
        [deployer.address, range.lower, range.upper]
      )
    );
    const position = await pool.positions(positionKey);
    console.log(`Fees for ${range.name}:`);
    console.log("Token0 fees:", position.tokensOwed0.toString());
    console.log("Token1 fees:", position.tokensOwed1.toString());
  }

  // 5. Final pool state
  const finalSlot0 = await pool.slot0();
  console.log("\nFinal pool state:");
  console.log("Final price:", finalSlot0.sqrtPriceX96.toString());
  console.log("Final tick:", finalSlot0.tick.toString());

  console.log("\nPool operation tests completed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
