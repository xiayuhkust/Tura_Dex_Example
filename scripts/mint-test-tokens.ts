import { ethers } from "hardhat";

async function main() {
  const OWNER_ADDRESS = "0x08Bb6eA809A2d6c13D57166Fa3ede48C0ae9a70e";
  const ADDRESSES = {
    TT1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
    TT2: '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122'
  };

  // Get token contracts
  const tt1 = await ethers.getContractAt("contracts/backup/core/TestToken.sol:TestToken", ADDRESSES.TT1);
  const tt2 = await ethers.getContractAt("contracts/backup/core/TestToken.sol:TestToken", ADDRESSES.TT2);

  // Get owner account
  const [owner] = await ethers.getSigners();
  console.log("Using owner account:", owner.address);

  // Mint tokens (10000 tokens each)
  const amount = ethers.utils.parseEther("10000");
  await tt1.mint(OWNER_ADDRESS, amount);
  await tt2.mint(OWNER_ADDRESS, amount);

  console.log("Tokens minted successfully!");
  console.log("TT1 balance:", ethers.utils.formatEther(await tt1.balanceOf(OWNER_ADDRESS)));
  console.log("TT2 balance:", ethers.utils.formatEther(await tt2.balanceOf(OWNER_ADDRESS)));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
