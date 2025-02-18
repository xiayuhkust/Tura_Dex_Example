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
  const INITIAL_PRICE = '79228162514264337593543950336'; // 1.0 in Q96
  const INITIAL_LIQUIDITY = '1000000'; // Very small amount for testing

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

    // Sort tokens and create pool
    if (token0.address.toLowerCase() > token1.address.toLowerCase()) {
      [token0, token1] = [token1, token0];
    }

    await factory.createPool(token0.address, token1.address, FEE_AMOUNT);
    pool = await ethers.getContractAt(
      'UniswapV3Pool',
      await factory.getPool(token0.address, token1.address, FEE_AMOUNT)
    );
    
    // Initialize pool and setup tokens
    await pool.initialize(INITIAL_PRICE);

    // Mint tokens and approve for all users
    await Promise.all(
      [owner, user1, user2].flatMap(user => 
        [token0, token1].map(async token => {
          await token.mint(user.address, ethers.utils.parseEther('1000000'));
          await token.connect(user).approve(pool.address, ethers.constants.MaxUint256);
        })
      )
    );

    // Note: Pool initialization is handled in individual tests that need it
  });

  describe('Pool Creation', () => {
    it('should create pool with correct tokens and fee', async () => {
      // Get sorted tokens for comparison
      const [expectedToken0, expectedToken1] = token0.address.toLowerCase() < token1.address.toLowerCase()
        ? [token0, token1]
        : [token1, token0];

      // Verify pool was created with correct tokens and fee
      expect((await pool.token0()).toLowerCase()).to.equal(expectedToken0.address.toLowerCase());
      expect((await pool.token1()).toLowerCase()).to.equal(expectedToken1.address.toLowerCase());
      expect(await pool.fee()).to.equal(FEE_AMOUNT);
    });

    it('should initialize pool with valid price', async () => {
      await pool.initialize(INITIAL_PRICE);
      const { sqrtPriceX96, tick } = await pool.slot0();
      expect(sqrtPriceX96).to.not.equal(0);
      expect(tick).to.equal(0); // Initial tick should be 0 at price of 1.0
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
      await pool.mint(
        owner.address,
        -887272,
        887272,
        INITIAL_LIQUIDITY
      );

      expect(await pool.liquidity()).to.equal(INITIAL_LIQUIDITY);
    });

    it('should track positions correctly', async () => {
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
