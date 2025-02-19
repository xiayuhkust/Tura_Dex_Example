import { ethers } from "hardhat";

async function main() {
  console.log("Deploying test tokens...");

  const TestToken = await ethers.getContractFactory("contracts/TestToken.sol:TestToken");
  
  // Deploy TT1
  console.log("Deploying TT1...");
  const tt1 = await TestToken.deploy("Test Token 1", "TT1");
  await tt1.deployed();
  console.log("TT1 deployed to:", tt1.address);

  // Deploy TT2
  console.log("Deploying TT2...");
  const tt2 = await TestToken.deploy("Test Token 2", "TT2");
  await tt2.deployed();
  console.log("TT2 deployed to:", tt2.address);

  // Verify deployment
  const tt1Name = await tt1.name();
  const tt1Symbol = await tt1.symbol();
  const tt2Name = await tt2.name();
  const tt2Symbol = await tt2.symbol();

  console.log("Deployment verified:");
  console.log("TT1:", { name: tt1Name, symbol: tt1Symbol, address: tt1.address });
  console.log("TT2:", { name: tt2Name, symbol: tt2Symbol, address: tt2.address });

  return { tt1: tt1.address, tt2: tt2.address };
}

main()
  .then((result) => {
    console.log(result);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
