import { ethers } from "hardhat";
import "@nomiclabs/hardhat-waffle";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Verifying core contracts with account:", deployer.address);

  // Contract addresses from deployment records
  const contracts = {
    factory: "0xC2EdBdd3394dA769De72986d06b0C28Ba991341d",
    pool: "0x47cC776b736B5898de24011909dDe0E91e41f88E", // WETH/TestToken1 pool
    weth: "0xc8F7d7989a409472945b00177396f4e9b8601DF3",
    testToken1: "0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9"
  };

  // Verify Factory
  const factoryAbi = [
    "function owner() view returns (address)",
    "function createPool(address,address,uint24) returns (address)",
    "function getPool(address,address,uint24) view returns (address)"
  ];
  const factory = await ethers.getContractAt(factoryAbi, contracts.factory);
  console.log("\nVerifying Factory contract:");
  try {
    console.log("Has bytecode:", (await ethers.provider.getCode(contracts.factory)).length > 2);
    console.log("Owner:", await factory.owner());
  } catch (error) {
    console.log("Error reading Factory details:", error.message);
  }

  // Verify Pool
  const poolAbi = [
    "function factory() view returns (address)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function fee() view returns (uint24)",
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
  ];
  const pool = await ethers.getContractAt(poolAbi, contracts.pool);
  console.log("\nVerifying Pool contract:");
  try {
    console.log("Has bytecode:", (await ethers.provider.getCode(contracts.pool)).length > 2);
    console.log("Factory:", await pool.factory());
    console.log("Token0:", await pool.token0());
    console.log("Token1:", await pool.token1());
    console.log("Fee:", await pool.fee());
    const slot0 = await pool.slot0();
    console.log("Pool initialized:", slot0.sqrtPriceX96.gt(0));
  } catch (error) {
    console.log("Error reading Pool details:", error.message);
  }

  // Verify NoDelegateCall by checking Factory and Pool implementations
  console.log("\nVerifying NoDelegateCall implementation:");
  const factoryCode = await ethers.provider.getCode(contracts.factory);
  const poolCode = await ethers.provider.getCode(contracts.pool);
  console.log("Factory includes NoDelegateCall:", factoryCode.includes("delegatecall"));
  console.log("Pool includes NoDelegateCall:", poolCode.includes("delegatecall"));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
