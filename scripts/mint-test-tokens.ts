import { ethers } from "hardhat";

async function main() {
  const ADDRESSES = {
    TT1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
    TT2: '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122'
  };

  // Get token contracts
  const tt1 = await ethers.getContractAt("contracts/backup/core/TestToken.sol:TestToken", ADDRESSES.TT1);
  const tt2 = await ethers.getContractAt("contracts/backup/core/TestToken.sol:TestToken", ADDRESSES.TT2);

  // Get signer
  const [signer] = await ethers.getSigners();

  // Mint tokens (10000 tokens each)
  const amount = ethers.utils.parseEther("10000");
  await tt1.mint(signer.address, amount);
  await tt2.mint(signer.address, amount);

  console.log("Tokens minted successfully!");
  console.log("TT1 balance:", ethers.utils.formatEther(await tt1.balanceOf(signer.address)));
  console.log("TT2 balance:", ethers.utils.formatEther(await tt2.balanceOf(signer.address)));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
