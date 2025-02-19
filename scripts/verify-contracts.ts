import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

async function main() {
  console.log('Verifying deployed contracts...');

  // Connect to contracts
  const factory = await ethers.getContractAt('TuraFactory', '0x511CE2380a70bE66FAf44a5baaBf11E92D654905');
  const router = await ethers.getContractAt('SwapRouter', '0xB492Bf5FBfA79364149CC76B77b8bd78BecD1416');
  const nftManager = await ethers.getContractAt('NonfungiblePositionManager', '0x6Ba55510435288424053d8924450Bb1269fD3BD2');

  // Verify Factory
  console.log('\nVerifying TuraFactory...');
  const feeEnabled = await factory.feeAmountEnabled(3000);
  console.log('Default fee tier (0.3%) enabled:', feeEnabled);

  // Verify Router
  console.log('\nVerifying SwapRouter...');
  const factoryFromRouter = await router.factory();
  console.log('Router factory address matches:', factoryFromRouter === factory.address);

  // Verify NFT Manager
  console.log('\nVerifying NonfungiblePositionManager...');
  const factoryFromNFT = await nftManager.factory();
  console.log('NFT Manager factory address matches:', factoryFromNFT === factory.address);

  // Create test pool
  console.log('\nCreating test pool...');
  const weth = await ethers.getContractAt('WETH9', '0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be');
  const testToken = await ethers.getContractAt('TestToken', '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9');
  
  // Create pool if it doesn't exist
  const poolAddress = await factory.getPool(weth.address, testToken.address, 3000);
  if (poolAddress === ethers.constants.AddressZero) {
    const tx = await factory.createPool(weth.address, testToken.address, 3000);
    await tx.wait();
    console.log('Test pool created');
  } else {
    console.log('Test pool exists at:', poolAddress);
  }

  // Verify pool creation
  const newPoolAddress = await factory.getPool(weth.address, testToken.address, 3000);
  console.log('Pool address:', newPoolAddress);
  const pool = await ethers.getContractAt('TuraPool', newPoolAddress);
  
  // Verify pool interface
  console.log('\nVerifying pool interface...');
  const token0 = await pool.token0();
  const token1 = await pool.token1();
  const fee = await pool.fee();
  console.log('Pool token0:', token0);
  console.log('Pool token1:', token1);
  console.log('Pool fee:', fee);

  console.log('\nContract verification complete');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
