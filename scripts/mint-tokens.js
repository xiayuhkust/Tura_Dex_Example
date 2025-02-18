const { ethers } = require("hardhat");

async function main() {
  const amount = ethers.utils.parseEther("10000"); // 10000 tokens with 18 decimals (10000 * 10^18 units)
  const ownerAddress = "0x08Bb6eA809A2d6c13D57166Fa3ede48C0ae9a70e";
  
  // Get token contracts
  const tt1 = await ethers.getContractAt("TestToken", "0xf7430841c1917Fee24B04dBbd0b809F36E5Ad716");
  const tt2 = await ethers.getContractAt("TestToken", "0x3Cbc85319E3D9d6b29DDe06f591017e9f9666652");
  
  console.log("Minting TT1...");
  const tx1 = await tt1.mint(ownerAddress, amount);
  await tx1.wait();
  console.log("TT1 minted successfully");
  
  console.log("Minting TT2...");
  const tx2 = await tt2.mint(ownerAddress, amount);
  await tx2.wait();
  console.log("TT2 minted successfully");
  
  // Verify balances
  const tt1Balance = await tt1.balanceOf(ownerAddress);
  const tt2Balance = await tt2.balanceOf(ownerAddress);
  
  console.log(`TT1 Balance: ${ethers.utils.formatEther(tt1Balance)} TT1`);
  console.log(`TT2 Balance: ${ethers.utils.formatEther(tt2Balance)} TT2`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
