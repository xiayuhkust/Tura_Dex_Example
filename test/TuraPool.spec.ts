import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from '@ethersproject/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { keccak256, defaultAbiCoder } from 'ethers/lib/utils';

describe('TuraPool', () => {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  
  let factory: Contract;
  let token0: Contract;
  let token1: Contract;
  let pool: Contract;

  // Fee amounts in basis points (0.05% = 500, 0.3% = 3000, 1% = 10000)
  const FEE_AMOUNTS = {
    LOW: 500,    // 0.05%
    MEDIUM: 3000,  // 0.3%
    HIGH: 10000    // 1%
  };
  const INITIAL_PRICE = '79228162514264337593543950336'; // 1.0 in Q96
  const INITIAL_LIQUIDITY = ethers.utils.parseUnits('1', 12); // 1 token for testing

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    // Get contract factories
    const TestERC20 = await ethers.getContractFactory('TestERC20');
    const UniswapV3Factory = await ethers.getContractFactory('UniswapV3Factory');

    // Deploy test tokens and factory
    token0 = await TestERC20.deploy('Test Token 0', 'TT0', 18);
    token1 = await TestERC20.deploy('Test Token 1', 'TT1', 18);
    factory = await UniswapV3Factory.deploy();
    
    await Promise.all([token0.deployed(), token1.deployed(), factory.deployed()]);

    // Sort tokens
    if (token0.address.toLowerCase() > token1.address.toLowerCase()) {
      [token0, token1] = [token1, token0];
    }

    // Mint initial tokens and approve
    const mintAmount = ethers.utils.parseEther('1000000');
    for (const token of [token0, token1]) {
      for (const user of [owner, user1, user2]) {
        await token.mint(user.address, mintAmount);
        await token.connect(user).approve(factory.address, ethers.constants.MaxUint256);
      }
    }

    // Create pool
    await factory.createPool(token0.address, token1.address, FEE_AMOUNTS.MEDIUM);
    const poolAddress = await factory.getPool(token0.address, token1.address, FEE_AMOUNTS.MEDIUM);
    pool = await ethers.getContractAt('UniswapV3Pool', poolAddress);

    // Mint tokens and approve for all users
    const mintAmount = ethers.utils.parseEther('0.0001'); // Small amount for testing
    for (const token of [token0, token1]) {
      for (const user of [owner, user1, user2]) {
        await token.mint(user.address, mintAmount);
        await token.connect(user).approve(poolAddress, ethers.constants.MaxUint256);
      }
    }

    // Initialize pool
    await pool.initialize(INITIAL_PRICE);

    // Note: Pool initialization is handled in individual tests that need it
  });

  describe('Pool Creation', () => {
    let testPool: Contract;

    it('should create pool with correct tokens and fee', async () => {
      await factory.createPool(token0.address, token1.address, FEE_AMOUNTS.MEDIUM);
      testPool = await ethers.getContractAt(
        'UniswapV3Pool',
        await factory.getPool(token0.address, token1.address, FEE_AMOUNTS.MEDIUM)
      );

      expect((await testPool.token0()).toLowerCase()).to.equal(token0.address.toLowerCase());
      expect((await testPool.token1()).toLowerCase()).to.equal(token1.address.toLowerCase());
      expect(await testPool.fee()).to.equal(FEE_AMOUNTS.MEDIUM);

      // Approve tokens for this pool
      await Promise.all(
        [owner, user1, user2].map(async user => {
          await token0.connect(user).approve(testPool.address, ethers.constants.MaxUint256);
          await token1.connect(user).approve(testPool.address, ethers.constants.MaxUint256);
        })
      );
    });

    it('should initialize pool with valid price', async () => {
      await factory.createPool(token0.address, token1.address, FEE_AMOUNTS.LOW);
      testPool = await ethers.getContractAt(
        'UniswapV3Pool',
        await factory.getPool(token0.address, token1.address, FEE_AMOUNTS.LOW)
      );
      
      await testPool.initialize(INITIAL_PRICE);
      const { sqrtPriceX96, tick } = await testPool.slot0();
      expect(sqrtPriceX96).to.not.equal(0);
      expect(tick).to.equal(0); // Initial tick should be 0 at price of 1.0

      // Approve tokens for this pool
      await Promise.all(
        [owner, user1, user2].map(async user => {
          await token0.connect(user).approve(testPool.address, ethers.constants.MaxUint256);
          await token1.connect(user).approve(testPool.address, ethers.constants.MaxUint256);
        })
      );
    });

    it('should fail with invalid fee tier', async () => {
      const invalidFee = 1234; // Not one of the valid fee tiers (500, 3000, 10000)
      await expect(
        factory.createPool(token0.address, token1.address, invalidFee)
      ).to.be.revertedWith('Invalid fee');
    });
  });

  describe('Liquidity Provision', () => {
    let poolAddress: string;
    
    beforeEach(async () => {
      // Create new pool with high fee for liquidity tests
      await factory.createPool(token0.address, token1.address, FEE_AMOUNTS.HIGH);
      poolAddress = await factory.getPool(token0.address, token1.address, FEE_AMOUNTS.HIGH);
      pool = await ethers.getContractAt('UniswapV3Pool', poolAddress);

      // Mint tokens and approve for all users
      const amount = ethers.utils.parseEther('10.0'); // Increase amount for sufficient liquidity
      await Promise.all(
        [owner, user1, user2].flatMap(user => [
          token0.mint(user.address, amount),
          token1.mint(user.address, amount),
          token0.connect(user).approve(poolAddress, ethers.constants.MaxUint256),
          token1.connect(user).approve(poolAddress, ethers.constants.MaxUint256)
        ])
      );

      // Initialize pool with initial price only
      if ((await pool.slot0()).sqrtPriceX96 == 0) {
        await pool.initialize(INITIAL_PRICE);
      }
    });

    it('should add initial liquidity', async () => {
      const amount = ethers.utils.parseUnits('0.000001', 18); // Very small amount
      
      // Initialize pool first
      if ((await pool.slot0()).sqrtPriceX96 == 0) {
        await pool.initialize(INITIAL_PRICE);
      }

      // Mint and approve tokens
      await token0.mint(owner.address, amount);
      await token1.mint(owner.address, amount);
      await token0.approve(pool.address, amount);
      await token1.approve(pool.address, amount);
      
      // Add liquidity
      await pool.mint(
        owner.address,
        -887272,
        887272,
        amount
      );

      // Verify liquidity
      const liquidity = await pool.liquidity();
      expect(liquidity).to.equal(amount);
    });

    it('should track positions correctly', async () => {
      const amount = ethers.utils.parseEther('1.0');
      const tickLower = -887272;
      const tickUpper = 887272;
      
      // Initialize pool first
      if ((await pool.slot0()).sqrtPriceX96 == 0) {
        await pool.initialize(INITIAL_PRICE);
      }
      
      // Add liquidity
      await pool.mint(
        owner.address,
        tickLower,
        tickUpper,
        amount
      );

      // Verify position
      const positionKey = keccak256(defaultAbiCoder.encode(['address', 'int24', 'int24'], [owner.address, tickLower, tickUpper]));
      const position = await pool.positions(positionKey);
      expect(position.liquidity).to.equal(amount);
    });

    it('should collect fees after swaps', async () => {
      // Add initial liquidity
      await pool.mint(
        owner.address,
        -887272,
        887272,
        INITIAL_LIQUIDITY
      );

      // Perform swap
      await token0.transfer(user1.address, INITIAL_LIQUIDITY);
      await token0.connect(user1).approve(pool.address, INITIAL_LIQUIDITY);
      
      await pool.connect(user1).swap(
        true,
        ethers.BigNumber.from(INITIAL_LIQUIDITY).div(2),
        owner.address
      );

      // Check fees
      const positionKey = keccak256(defaultAbiCoder.encode(['address', 'int24', 'int24'], [owner.address, -887272, 887272]));
      const position = await pool.positions(positionKey);
      expect(position.tokensOwed0.add(position.tokensOwed1)).to.be.gt(0);
    });
  });
});
