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

  const FEE_AMOUNT = 3000; // 0.3%
  const INITIAL_PRICE = '1000000000000000000'; // 1.0
  const INITIAL_LIQUIDITY = '10000000000000'; // 0.00001 - Extremely small amount for Tura testing

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    // Get contract factories
    const TestERC20 = await ethers.getContractFactory('TestERC20');
    const UniswapV3Factory = await ethers.getContractFactory('UniswapV3Factory');

    // Deploy test tokens
    token0 = await TestERC20.deploy('Test Token 0', 'TT0', 18);
    token1 = await TestERC20.deploy('Test Token 1', 'TT1', 18);

    // Mint initial tokens to owner and users
    const mintAmount = ethers.utils.parseEther('1.0'); // Mint more tokens than needed
    await token0.mint(owner.address, mintAmount);
    await token1.mint(owner.address, mintAmount);
    await token0.mint(user1.address, mintAmount);
    await token1.mint(user1.address, mintAmount);
    await token0.mint(user2.address, mintAmount);
    await token1.mint(user2.address, mintAmount);

    // Deploy factory
    factory = await UniswapV3Factory.deploy();

    // Sort tokens for pool creation
    const [sortedToken0, sortedToken1] = token0.address.toLowerCase() < token1.address.toLowerCase()
      ? [token0, token1]
      : [token1, token0];

    // Create pool
    await factory.createPool(sortedToken0.address, sortedToken1.address, FEE_AMOUNT);
    const poolAddress = await factory.getPool(sortedToken0.address, sortedToken1.address, FEE_AMOUNT);
    pool = await ethers.getContractAt('UniswapV3Pool', poolAddress);

    // Approve tokens for all tests
    await sortedToken0.approve(pool.address, ethers.constants.MaxUint256);
    await sortedToken1.approve(pool.address, ethers.constants.MaxUint256);
    await sortedToken0.connect(user1).approve(pool.address, ethers.constants.MaxUint256);
    await sortedToken1.connect(user1).approve(pool.address, ethers.constants.MaxUint256);
    await sortedToken0.connect(user2).approve(pool.address, ethers.constants.MaxUint256);
    await sortedToken1.connect(user2).approve(pool.address, ethers.constants.MaxUint256);
  });

  describe('Pool Creation', () => {
    it('should create pool with correct tokens and fee', async () => {
      const poolToken0 = await pool.token0();
      const poolToken1 = await pool.token1();
      const poolFee = await pool.fee();
      
      // Get pool tokens
      const poolToken0 = await pool.token0();
      const poolToken1 = await pool.token1();
      const poolFee = await pool.fee();

      // Verify pool was created with correct tokens and fee
      expect(poolToken0.toLowerCase()).to.equal(sortedToken0.address.toLowerCase());
      expect(poolToken1.toLowerCase()).to.equal(sortedToken1.address.toLowerCase());
      expect(poolFee).to.equal(FEE_AMOUNT);
      expect(poolFee).to.equal(FEE_AMOUNT);
      expect(await pool.token1()).to.equal(token1.address);
      expect(await pool.fee()).to.equal(FEE_AMOUNT);
    });

    it('should initialize pool with valid price', async () => {
      await pool.initialize(INITIAL_PRICE);
      const { sqrtPriceX96 } = await pool.slot0();
      expect(sqrtPriceX96).to.not.equal(0);
    });

    it('should fail with invalid fee tier', async () => {
      await expect(
        factory.createPool(token0.address, token1.address, 1234)
      ).to.be.revertedWith('Invalid fee');
    });
  });

  describe('Liquidity Provision', () => {
    beforeEach(async () => {
      await pool.initialize(INITIAL_PRICE);
    });

    it('should add initial liquidity', async () => {
      await token0.approve(pool.address, INITIAL_LIQUIDITY);
      await token1.approve(pool.address, INITIAL_LIQUIDITY);

      await pool.mint(
        owner.address,
        -887272,
        887272,
        INITIAL_LIQUIDITY
      );

      expect(await pool.liquidity()).to.equal(INITIAL_LIQUIDITY);
    });

    it('should track positions correctly', async () => {
      await token0.approve(pool.address, INITIAL_LIQUIDITY);
      await token1.approve(pool.address, INITIAL_LIQUIDITY);

      await pool.mint(
        owner.address,
        -887272,
        887272,
        INITIAL_LIQUIDITY
      );

      const positionKey = keccak256(defaultAbiCoder.encode(['address', 'int24', 'int24'], [owner.address, -887272, 887272]));
      const position = await pool.positions(positionKey);
      expect(position.liquidity).to.equal(INITIAL_LIQUIDITY);
    });

    it('should collect fees after swaps', async () => {
      // Add initial liquidity
      await token0.approve(pool.address, INITIAL_LIQUIDITY);
      await token1.approve(pool.address, INITIAL_LIQUIDITY);

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
