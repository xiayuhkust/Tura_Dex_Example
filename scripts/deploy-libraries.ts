import hre from 'hardhat';
import { Contract } from '@ethersproject/contracts';

async function main() {
  console.log('Deploying math libraries...');

  // Deploy TickMath
  const TickMath = await hre.ethers.getContractFactory('TickMath');
  const tickMath = await TickMath.deploy();
  const tickMathAddress = tickMath.address;
  console.log('TickMath deployed to:', tickMathAddress);

  // Deploy SqrtPriceMath
  const SqrtPriceMath = await hre.ethers.getContractFactory('SqrtPriceMath');
  const sqrtPriceMath = await SqrtPriceMath.deploy();
  const sqrtPriceMathAddress = sqrtPriceMath.address;
  console.log('SqrtPriceMath deployed to:', sqrtPriceMathAddress);

  // Deploy Position
  const Position = await hre.ethers.getContractFactory('Position');
  const position = await Position.deploy();
  const positionAddress = position.address;
  console.log('Position deployed to:', positionAddress);

  // Deploy FullMath
  const FullMath = await hre.ethers.getContractFactory('FullMath');
  const fullMath = await FullMath.deploy();
  const fullMathAddress = fullMath.address;
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
