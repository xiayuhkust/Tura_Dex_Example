import hre from 'hardhat';
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
  const INITIAL_LIQUIDITY = '1000000000000000000'; // 1.0

  beforeEach(async () => {
    [owner, user1, user2] = await hre.ethers.getSigners();

    // Get contract factories
    const TestERC20 = await hre.ethers.getContractFactory('TestERC20');
    const UniswapV3Factory = await hre.ethers.getContractFactory('UniswapV3Factory');

    // Deploy test tokens
    token0 = await TestERC20.deploy('Test Token 0', 'TT0', 18);
    token1 = await TestERC20.deploy('Test Token 1', 'TT1', 18);

    // Deploy factory
    factory = await UniswapV3Factory.deploy();

    // Create pool
    await factory.createPool(token0.address, token1.address, FEE_AMOUNT);
    const poolAddress = await factory.getPool(token0.address, token1.address, FEE_AMOUNT);
    pool = await hre.ethers.getContractAt('UniswapV3Pool', poolAddress);
  });

  describe('Pool Creation', () => {
    it('should create pool with correct tokens and fee', async () => {
      const poolToken0 = await pool.token0();
      const poolToken1 = await pool.token1();
      const poolFee = await pool.fee();
      
      expect([poolToken0.toLowerCase(), poolToken1.toLowerCase()]).to.have.members([token0.address.toLowerCase(), token1.address.toLowerCase()]);
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
      ).to.be.revertedWith('TF: FEE_NOT_ENABLED');
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
        hre.ethers.BigNumber.from(INITIAL_LIQUIDITY).div(2),
        owner.address
      );

      // Check fees
      const positionKey = keccak256(defaultAbiCoder.encode(['address', 'int24', 'int24'], [owner.address, -887272, 887272]));
      const position = await pool.positions(positionKey);
      expect(position.tokensOwed0.add(position.tokensOwed1)).to.be.gt(0);
    });
  });
});
