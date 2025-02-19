const hre = require("hardhat");

async function main() {
  console.log("Deploying TuraWETH contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const TuraWETH = await hre.ethers.getContractFactory("contracts/backup/core/TuraWETH.sol:TuraWETH");
  console.log("Deploying TuraWETH...");
  
  const weth = await TuraWETH.deploy();
  await weth.deployed();

  console.log("TuraWETH deployed to:", weth.address);

  // Test basic functionality
  console.log("\nTesting basic functionality...");
  
  // Test deposit
  const depositAmount = hre.ethers.utils.parseEther("1.0");
  console.log(`\nDepositing ${hre.ethers.utils.formatEther(depositAmount)} Tura`);
  const depositTx = await weth.deposit({ value: depositAmount });
  await depositTx.wait();
  
  // Check balance
  const balance = await weth.balanceOf(deployer.address);
  console.log(`WTURA balance after deposit: ${hre.ethers.utils.formatEther(balance)}`);

  // Test withdraw
  const withdrawAmount = hre.ethers.utils.parseEther("0.5");
  console.log(`\nWithdrawing ${hre.ethers.utils.formatEther(withdrawAmount)} WTURA`);
  const withdrawTx = await weth.withdraw(withdrawAmount);
  await withdrawTx.wait();
  
  const finalBalance = await weth.balanceOf(deployer.address);
  console.log(`WTURA balance after withdraw: ${hre.ethers.utils.formatEther(finalBalance)}`);

  console.log("\nDeployment and testing complete!");
  return weth.address;
}

main()
  .then((address) => {
    console.log("\nFinal deployed address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
