import { ethers } from 'hardhat';

async function main() {
  console.log('Deploying math libraries...');

  // Deploy TickMath
  const TickMath = await ethers.getContractFactory('TickMath');
  const tickMath = await TickMath.deploy();
  await tickMath.waitForDeployment();
  const tickMathAddress = await tickMath.getAddress();
  console.log('TickMath deployed to:', tickMathAddress);

  // Deploy SqrtPriceMath
  const SqrtPriceMath = await ethers.getContractFactory('SqrtPriceMath');
  const sqrtPriceMath = await SqrtPriceMath.deploy();
  await sqrtPriceMath.waitForDeployment();
  const sqrtPriceMathAddress = await sqrtPriceMath.getAddress();
  console.log('SqrtPriceMath deployed to:', sqrtPriceMathAddress);

  // Deploy Position
  const Position = await ethers.getContractFactory('Position');
  const position = await Position.deploy();
  await position.waitForDeployment();
  const positionAddress = await position.getAddress();
  console.log('Position deployed to:', positionAddress);

  // Deploy FullMath
  const FullMath = await ethers.getContractFactory('FullMath');
  const fullMath = await FullMath.deploy();
  await fullMath.waitForDeployment();
  const fullMathAddress = await fullMath.getAddress();
  console.log('FullMath deployed to:', fullMathAddress);

  console.log('\nLibrary Addresses:');
  console.log('TickMath:', tickMathAddress);
  console.log('SqrtPriceMath:', sqrtPriceMathAddress);
  console.log('Position:', positionAddress);
  console.log('FullMath:', fullMathAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
