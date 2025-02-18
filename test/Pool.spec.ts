import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract, BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';

chai.use(solidity);

describe('UniswapV3Pool', () => {
    let factory: Contract;
    let pool: Contract;
    let token0: Contract;
    let token1: Contract;
    let owner: SignerWithAddress;
    let other: SignerWithAddress;

    const FEE = 3000; // 0.3%
    const SQRT_PRICE_X96 = BigNumber.from('79228162514264337593543950336'); // 1.0
    const TICK_SPACING = 60;
    const MIN_TICK = -887272;
    const MAX_TICK = 887272;

    beforeEach(async () => {
        [owner, other] = await ethers.getSigners();

        // Deploy test tokens
        const TokenFactory = await ethers.getContractFactory('TestERC20');
        token0 = await TokenFactory.deploy('Token0', 'TK0', 18);
        token1 = await TokenFactory.deploy('Token1', 'TK1', 18);

        // Deploy factory
        const FactoryFactory = await ethers.getContractFactory('UniswapV3Factory');
        factory = await FactoryFactory.deploy();
    });

    describe('initialization', () => {
        beforeEach(async () => {
            // Create new pool for each test
            await factory.createPool(token0.address, token1.address, FEE);
            const poolAddress = await factory.getPool(token0.address, token1.address, FEE);
            pool = await ethers.getContractAt('UniswapV3Pool', poolAddress);

            // Approve tokens
            await token0.approve(pool.address, ethers.constants.MaxUint256);
            await token1.approve(pool.address, ethers.constants.MaxUint256);
            await token0.connect(other).approve(pool.address, ethers.constants.MaxUint256);
            await token1.connect(other).approve(pool.address, ethers.constants.MaxUint256);
        });

        it('sets initial price', async () => {
            await pool.initialize(SQRT_PRICE_X96);
            const { sqrtPriceX96, tick } = await pool.slot0();
            expect(sqrtPriceX96).to.equal(SQRT_PRICE_X96);
            expect(tick).to.equal(0);
        });

        it('reverts if already initialized', async () => {
            await pool.initialize(SQRT_PRICE_X96);
            await expect(pool.initialize(SQRT_PRICE_X96)).to.be.revertedWith('AI');
        });
    });

    describe('minting', () => {
        beforeEach(async () => {
            // Setup initial amounts - using minimal amounts for Tura testing
            const userAmount = ethers.utils.parseEther('0.00000001'); // 0.00000001 Tura for testing (~40 Tura total)
            const lpAmount = ethers.utils.parseEther('0.000000005'); // 0.000000005 Tura for LP (~2900 Tura total)
            
            // Mint tokens first
            await token0.mint(owner.address, userAmount.mul(2));
            await token1.mint(owner.address, userAmount.mul(2));
            await token0.mint(other.address, userAmount);
            await token1.mint(other.address, userAmount);

            // Initialize pool
            await pool.initialize(SQRT_PRICE_X96);
        });

        it('fails with zero liquidity', async () => {
            await expect(
                pool.mint(owner.address, MIN_TICK, MAX_TICK, 0)
            ).to.be.revertedWith('IL');
        });

        it('fails with invalid tick range', async () => {
            await expect(
                pool.mint(owner.address, MAX_TICK, MIN_TICK, 1000)
            ).to.be.revertedWith('TLU');
        });

        it('creates a position and updates liquidity', async () => {
            const liquidityAmount = 1000;
            await pool.mint(owner.address, MIN_TICK, MAX_TICK, liquidityAmount);

            const position = await pool.getPosition(owner.address, MIN_TICK, MAX_TICK);
            expect(position.liquidity).to.equal(liquidityAmount);
            expect(await pool.liquidity()).to.equal(liquidityAmount);
        });
    });

    describe('swapping', () => {
        beforeEach(async () => {
            // Setup initial amounts - using minimal amounts for Tura testing
            const userAmount = ethers.utils.parseEther('0.00000001'); // 0.00000001 Tura for testing (~40 Tura total)
            const lpAmount = ethers.utils.parseEther('0.000000005'); // 0.000000005 Tura for LP (~2900 Tura total)
            
            // Mint tokens first
            await token0.mint(owner.address, userAmount.mul(2));
            await token1.mint(owner.address, userAmount.mul(2));
            await token0.mint(other.address, userAmount);
            await token1.mint(other.address, userAmount);

            // Initialize pool
            await pool.initialize(SQRT_PRICE_X96);

            // Add initial liquidity
            await pool.mint(owner.address, MIN_TICK, MAX_TICK, lpAmount);
        });

        it('executes swap zero for one', async () => {
            const swapAmount = ethers.utils.parseEther('0.000000001'); // Small enough for ~40 Tura balance
            await token0.mint(other.address, swapAmount);
            await token0.connect(other).approve(pool.address, swapAmount);

            await pool.connect(other).swap(true, swapAmount, other.address);
            
            const { sqrtPriceX96, tick } = await pool.slot0();
            expect(sqrtPriceX96).to.be.lt(SQRT_PRICE_X96);
            expect(tick).to.be.lt(0);
        });

        it('executes swap one for zero', async () => {
            const swapAmount = ethers.utils.parseEther('0.000000001'); // Small enough for ~40 Tura balance
            await token1.mint(other.address, swapAmount);
            await token1.connect(other).approve(pool.address, swapAmount);

            await pool.connect(other).swap(false, swapAmount, other.address);
            
            const { sqrtPriceX96, tick } = await pool.slot0();
            expect(sqrtPriceX96).to.be.gt(SQRT_PRICE_X96);
            expect(tick).to.be.gt(0);
        });

        it('collects fees', async () => {
            const swapAmount = ethers.utils.parseEther('0.000000001'); // Small enough for ~40 Tura balance
            await token0.mint(other.address, swapAmount);
            await token0.connect(other).approve(pool.address, swapAmount);
            await pool.connect(other).swap(true, swapAmount, other.address);

            // Check initial balance
            const initialBalance0 = await token0.balanceOf(owner.address);
            
            // Collect fees
            await pool.collect(owner.address, MIN_TICK, MAX_TICK);
            
            // Check final balance
            const finalBalance0 = await token0.balanceOf(owner.address);
            const expectedFees = ethers.utils.parseEther('0.0000000000003'); // 0.3% of swap amount
            
            expect(finalBalance0.sub(initialBalance0)).to.equal(expectedFees, "Fee collection incorrect");
        });
    });
});
