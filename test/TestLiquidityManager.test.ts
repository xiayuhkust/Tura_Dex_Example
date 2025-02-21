import { ethers } from 'hardhat';
import { Contract } from '@ethersproject/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { TickMath } from '../frontend/src/utils/TickMath';
import { LiquidityAmounts } from '../frontend/src/utils/LiquidityAmounts';

describe('TestLiquidityManager', () => {
  let wallet: SignerWithAddress;
  let token0: Contract;
  let token1: Contract;
  let liquidityManager: Contract;
  let poolContract: Contract;

  const POOL_ADDRESS = '0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347';
  const TOKEN0_ADDRESS = '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9';
  const TOKEN1_ADDRESS = '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122';

  const tokenAbi = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function transfer(address to, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) external view returns (uint256)'
  ];

  const poolAbi = [
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
    'function liquidity() external view returns (uint128)',
    'function tickSpacing() external view returns (int24)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function mint(address recipient, int24 tickLower, int24 tickUpper, uint128 amount, bytes calldata data) external returns (uint256 amount0, uint256 amount1)'
  ];

  before(async () => {
    [wallet] = await ethers.getSigners();
    
    // Deploy test liquidity manager
    const TestLiquidityManager = await ethers.getContractFactory('TestLiquidityManager');
    liquidityManager = await TestLiquidityManager.deploy(POOL_ADDRESS);
    await liquidityManager.deployed();

    // Initialize contracts
    token0 = new Contract(TOKEN0_ADDRESS, tokenAbi, wallet);
    token1 = new Contract(TOKEN1_ADDRESS, tokenAbi, wallet);
    poolContract = new Contract(POOL_ADDRESS, poolAbi, wallet);
  });

  it('should add liquidity to pool', async function() {
    this.timeout(60000);

    // Get initial balances
    const initialBalance0 = await token0.balanceOf(wallet.address);
    const initialBalance1 = await token1.balanceOf(wallet.address);
    console.log('Initial balances:', {
      token0: ethers.utils.formatUnits(initialBalance0, 18),
      token1: ethers.utils.formatUnits(initialBalance1, 18)
    });

    // Get pool state
    const [sqrtPrice, currentTick] = await poolContract.slot0();
    const poolLiquidity = await poolContract.liquidity();
    const tickSpacing = await poolContract.tickSpacing();
    
    console.log('Pool state:', {
      sqrtPrice: sqrtPrice.toString(),
      currentTick: currentTick.toString(),
      liquidity: poolLiquidity.toString(),
      tickSpacing: tickSpacing.toString()
    });

    // Calculate tick range
    const tickRangeMultiplier = 10;
    const tickLower = tickSpacing * tickRangeMultiplier * -1;
    const tickUpper = tickSpacing * tickRangeMultiplier;

    // Set amounts
    const amount0Desired = ethers.utils.parseUnits('10.0', 18);
    const amount1Desired = ethers.utils.parseUnits('10.0', 18);

    // Calculate liquidity amount
    const lowerSqrtPriceX96 = ethers.BigNumber.from(TickMath.getSqrtRatioAtTick(tickLower));
    const upperSqrtPriceX96 = ethers.BigNumber.from(TickMath.getSqrtRatioAtTick(tickUpper));

    const liquidity = LiquidityAmounts.getLiquidityForAmounts(
      sqrtPrice,
      lowerSqrtPriceX96,
      upperSqrtPriceX96,
      amount0Desired,
      amount1Desired
    );

    console.log('Calculated liquidity:', {
      amount: liquidity.toString(),
      formatted: ethers.utils.formatUnits(liquidity, 18)
    });

    // Approve tokens
    await token0.approve(liquidityManager.address, amount0Desired);
    await token1.approve(liquidityManager.address, amount1Desired);

    console.log('Adding liquidity with params:', {
      recipient: wallet.address,
      tickLower,
      tickUpper,
      liquidity: liquidity.toString(),
      token0: TOKEN0_ADDRESS,
      token1: TOKEN1_ADDRESS
    });

    const tx = await liquidityManager.addLiquidityTest(
      wallet.address,
      tickLower,
      tickUpper,
      liquidity,
      TOKEN0_ADDRESS,
      TOKEN1_ADDRESS,
      { gasLimit: 5000000 }
    );

    console.log('Transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.transactionHash);

    // Verify balances changed
    const finalBalance0 = await token0.balanceOf(wallet.address);
    const finalBalance1 = await token1.balanceOf(wallet.address);
    
    const token0Deducted = initialBalance0.sub(finalBalance0);
    const token1Deducted = initialBalance1.sub(finalBalance1);

    console.log('Tokens deducted:', {
      token0: ethers.utils.formatUnits(token0Deducted, 18),
      token1: ethers.utils.formatUnits(token1Deducted, 18)
    });

    expect(token0Deducted).to.be.gt(0, 'No token0 was deducted');
    expect(token1Deducted).to.be.gt(0, 'No token1 was deducted');
  });
});
