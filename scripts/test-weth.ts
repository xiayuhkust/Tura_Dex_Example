import { ethers } from "hardhat";

async function main() {
  console.log("Testing TuraWETH contract...");

  const [owner] = await ethers.getSigners();
  console.log("Testing with account:", owner.address);

  // Get contract instance
  const TuraWETH = await ethers.getContractFactory("contracts/backup/core/TuraWETH.sol:TuraWETH");
  const weth = await TuraWETH.attach("0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be");

  // Test deposit (wrap)
  const depositAmount = ethers.utils.parseEther("1.0");
  console.log("\nTesting wrap (deposit)...");
  console.log(`Depositing ${ethers.utils.formatEther(depositAmount)} Tura`);
  
  const depositTx = await weth.deposit({ value: depositAmount });
  await depositTx.wait();
  
  let balance = await weth.balanceOf(owner.address);
  console.log(`WTURA balance after deposit: ${ethers.utils.formatEther(balance)}`);

  // Test withdraw (unwrap)
  console.log("\nTesting unwrap (withdraw)...");
  const withdrawAmount = ethers.utils.parseEther("0.5");
  console.log(`Withdrawing ${ethers.utils.formatEther(withdrawAmount)} WTURA`);
  
  const withdrawTx = await weth.withdraw(withdrawAmount);
  await withdrawTx.wait();
  
  balance = await weth.balanceOf(owner.address);
  console.log(`WTURA balance after withdraw: ${ethers.utils.formatEther(balance)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
