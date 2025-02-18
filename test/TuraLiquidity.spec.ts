import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { keccak256, defaultAbiCoder } from 'ethers/lib/utils';

describe('TuraLiquidity', () => {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  
  let factory: Contract;
  let token0: Contract;
  let token1: Contract;
  let pool: Contract;

  const FEE_AMOUNTS = [3000, 5000, 10000]; // 0.3%, 0.5%, 1%
  const INITIAL_PRICE = '79228162514264337593543950336'; // 1.0 in Q96
  const BASE_AMOUNT = ethers.utils.parseUnits('1', 12); // 1e12 base units
  const INITIAL_LIQUIDITY = BASE_AMOUNT.mul(10).toString(); // 10x base amount for testing
  const TICK_RANGES = [
    { lower: -887272, upper: 887272 }, // Full range
    { lower: -443636, upper: 443636 }, // Half range
    { lower: -221818, upper: 221818 }  // Quarter range
  ];

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy test tokens
    const TestERC20 = await ethers.getContractFactory('TestERC20');
    token0 = await TestERC20.deploy('Test Token 0', 'TT0', 18);
    token1 = await TestERC20.deploy('Test Token 1', 'TT1', 18);

    // Deploy factory
    const UniswapV3Factory = await ethers.getContractFactory('UniswapV3Factory');
    factory = await UniswapV3Factory.deploy();

    // Sort tokens for pool creation
    const [sortedToken0, sortedToken1] = token0.address.toLowerCase() < token1.address.toLowerCase()
      ? [token0, token1]
      : [token1, token0];

    // Create pool with 0.3% fee
    await factory.createPool(sortedToken0.address, sortedToken1.address, FEE_AMOUNTS[0]);
    const poolAddress = await factory.getPool(sortedToken0.address, sortedToken1.address, FEE_AMOUNTS[0]);
    pool = await ethers.getContractAt('UniswapV3Pool', poolAddress);

    // Mint initial tokens and approve
    const mintAmount = BASE_AMOUNT.mul(100000); // Very large buffer for testing
    const tokens = [token0, token1];
    const users = [owner, user1, user2];
    
    // Mint tokens for all users
    for (const token of tokens) {
      for (const user of users) {
        await token.mint(user.address, mintAmount);
        await token.connect(user).approve(poolAddress, ethers.constants.MaxUint256);
      }
    }
    
    // Log initial balances for debugging
    for (const user of users) {
      const balance0 = await token0.balanceOf(user.address);
      const balance1 = await token1.balanceOf(user.address);
      console.log(`${user.address} balances:`, 
        ethers.utils.formatUnits(balance0, 18),
        ethers.utils.formatUnits(balance1, 18)
      );
    }

    // Initialize pool
    await pool.initialize(INITIAL_PRICE);
  });

  describe('Liquidity Provision', () => {
    it('should add initial liquidity in full range', async () => {
      const { lower, upper } = TICK_RANGES[0];
      
      // Add liquidity
      await pool.mint(
        owner.address,
        lower,
        upper,
        INITIAL_LIQUIDITY
      );

      // Verify position
      const positionKey = keccak256(defaultAbiCoder.encode(['address', 'int24', 'int24'], [owner.address, lower, upper]));
      const position = await pool.positions(positionKey);
      expect(position.liquidity).to.equal(INITIAL_LIQUIDITY);
    });

    it('should add liquidity in multiple ranges', async () => {
      for (const range of TICK_RANGES) {
        await pool.mint(
          owner.address,
          range.lower,
          range.upper,
          INITIAL_LIQUIDITY
        );

        // Verify position
        const positionKey = keccak256(defaultAbiCoder.encode(['address', 'int24', 'int24'], [owner.address, range.lower, range.upper]));
        const position = await pool.positions(positionKey);
        expect(position.liquidity).to.equal(INITIAL_LIQUIDITY);
      }
    });

    it('should allow multiple LPs to add liquidity', async () => {
      const { lower, upper } = TICK_RANGES[0];
      
      // First LP adds liquidity
      await pool.connect(user1).mint(user1.address, lower, upper, INITIAL_LIQUIDITY);

      // Second LP adds liquidity
      await pool.connect(user2).mint(user2.address, lower, upper, INITIAL_LIQUIDITY);

      // Verify both positions
      const position1Key = keccak256(defaultAbiCoder.encode(['address', 'int24', 'int24'], [user1.address, lower, upper]));
      const position2Key = keccak256(defaultAbiCoder.encode(['address', 'int24', 'int24'], [user2.address, lower, upper]));
      const position1 = await pool.positions(position1Key);
      const position2 = await pool.positions(position2Key);
      expect(position1.liquidity).to.equal(INITIAL_LIQUIDITY);
      expect(position2.liquidity).to.equal(INITIAL_LIQUIDITY);
    });

    it('should collect fees after swaps', async () => {
      const { lower, upper } = TICK_RANGES[0];
      
      // Initialize pool first
      if ((await pool.slot0()).sqrtPriceX96 == 0) {
        await pool.initialize(INITIAL_PRICE);
      }
      
      // Add initial liquidity
      const liquidityAmount = BASE_AMOUNT.mul(100); // 100x base amount for meaningful swaps
      await pool.mint(owner.address, lower, upper, liquidityAmount);

      // Perform swap
      const swapAmount = BASE_AMOUNT.mul(10); // 10x base amount for swap
      await token0.mint(user1.address, swapAmount.mul(100)); // Extra buffer
      await token0.connect(user1).approve(pool.address, ethers.constants.MaxUint256);
      await pool.connect(user1).swap(
        true, // zeroForOne
        swapAmount,
        owner.address
      );

      // Collect fees
      await pool.collect(owner.address, lower, upper);
      const positionKey = keccak256(defaultAbiCoder.encode(['address', 'int24', 'int24'], [owner.address, lower, upper]));
      const position = await pool.positions(positionKey);
      expect(position.tokensOwed0.add(position.tokensOwed1)).to.be.gt(0);
    });
  });
});
