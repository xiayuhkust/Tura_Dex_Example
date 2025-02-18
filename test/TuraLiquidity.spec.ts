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
  const INITIAL_PRICE = '1000000000000000000'; // 1.0
  const INITIAL_LIQUIDITY = '100000000'; // Even smaller amount for testing
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

    // Mint initial tokens and approve for all users
    const mintAmount = ethers.utils.parseEther('1000000'); // Large amount for testing
    for (const token of [sortedToken0, sortedToken1]) {
      for (const user of [owner, user1, user2]) {
        await token.mint(user.address, mintAmount);
        await token.connect(user).approve(pool.address, ethers.constants.MaxUint256);
        console.log(`Balance for ${user.address}: ${await token.balanceOf(user.address)}`);
        console.log(`Allowance for ${user.address}: ${await token.allowance(user.address, pool.address)}`);
      }
    }
  });

  describe('Liquidity Provision', () => {
    it('should add initial liquidity in full range', async () => {
      const { lower, upper } = TICK_RANGES[0];
      
      await token0.approve(pool.address, INITIAL_LIQUIDITY);
      await token1.approve(pool.address, INITIAL_LIQUIDITY);

      await pool.mint(
        owner.address,
        lower,
        upper,
        INITIAL_LIQUIDITY
      );

      const positionKey = keccak256(defaultAbiCoder.encode(['address', 'int24', 'int24'], [owner.address, lower, upper]));
      const position = await pool.positions(positionKey);
      expect(position.liquidity).to.equal(INITIAL_LIQUIDITY);
    });

    it('should add liquidity in multiple ranges', async () => {
      for (const range of TICK_RANGES) {
        await token0.approve(pool.address, INITIAL_LIQUIDITY);
        await token1.approve(pool.address, INITIAL_LIQUIDITY);

        await pool.mint(
          owner.address,
          range.lower,
          range.upper,
          INITIAL_LIQUIDITY
        );

        const positionKey = keccak256(defaultAbiCoder.encode(['address', 'int24', 'int24'], [owner.address, range.lower, range.upper]));
        const position = await pool.positions(positionKey);
        expect(position.liquidity).to.equal(INITIAL_LIQUIDITY);
      }
    });

    it('should allow multiple LPs to add liquidity', async () => {
      const { lower, upper } = TICK_RANGES[0];
      
      // First LP
      await pool.connect(user1).mint(user1.address, lower, upper, INITIAL_LIQUIDITY);

      // Second LP
      await pool.connect(user2).mint(user2.address, lower, upper, INITIAL_LIQUIDITY);

      const position1Key = keccak256(defaultAbiCoder.encode(['address', 'int24', 'int24'], [user1.address, lower, upper]));
      const position2Key = keccak256(defaultAbiCoder.encode(['address', 'int24', 'int24'], [user2.address, lower, upper]));
      const position1 = await pool.positions(position1Key);
      const position2 = await pool.positions(position2Key);
      expect(position1.liquidity).to.equal(INITIAL_LIQUIDITY);
      expect(position2.liquidity).to.equal(INITIAL_LIQUIDITY);
    });

    it('should collect fees after swaps', async () => {
      const { lower, upper } = TICK_RANGES[0];
      
      // Add initial liquidity
      await token0.approve(pool.address, INITIAL_LIQUIDITY);
      await token1.approve(pool.address, INITIAL_LIQUIDITY);
      await pool.mint(owner.address, lower, upper, INITIAL_LIQUIDITY);

      // Perform swap
      await token0.transfer(user1.address, INITIAL_LIQUIDITY);
      await token0.connect(user1).approve(pool.address, INITIAL_LIQUIDITY);
      await pool.connect(user1).swap(
        true,
        BigNumber.from(INITIAL_LIQUIDITY).div(2),
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
