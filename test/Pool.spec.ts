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
    const BASE_AMOUNT = ethers.utils.parseUnits('0.01', 18); // Small base amount
    const BUFFER_MULTIPLIER = 10000; // Buffer multiplier for token amounts

    beforeEach(async () => {
        [owner, other] = await ethers.getSigners();
        
        // Deploy new tokens for each test
        const TokenFactory = await ethers.getContractFactory('TestERC20');
        token0 = await TokenFactory.deploy('Token0', 'TK0', 18);
        token1 = await TokenFactory.deploy('Token1', 'TK1', 18);

        // Deploy factory
        const FactoryFactory = await ethers.getContractFactory('UniswapV3Factory');
        factory = await FactoryFactory.deploy();

        // Create pool
        await factory.createPool(token0.address, token1.address, FEE);
        const poolAddress = await factory.getPool(token0.address, token1.address, FEE);
        pool = await ethers.getContractAt('UniswapV3Pool', poolAddress);

        // Mint tokens with extra buffer
        const mintAmount = BASE_AMOUNT.mul(BUFFER_MULTIPLIER);
        await token0.mint(owner.address, mintAmount);
        await token1.mint(owner.address, mintAmount);
        await token0.mint(other.address, mintAmount);
        await token1.mint(other.address, mintAmount);

        // Approve tokens
        await token0.approve(pool.address, ethers.constants.MaxUint256);
        await token1.approve(pool.address, ethers.constants.MaxUint256);
        await token0.connect(other).approve(pool.address, ethers.constants.MaxUint256);
        await token1.connect(other).approve(pool.address, ethers.constants.MaxUint256);
    });

    describe('initialization', () => {

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

    async function setupTestPool() {
        // Initialize pool
        await pool.initialize(SQRT_PRICE_X96);
        return {
            userAmount: BASE_AMOUNT,
            lpAmount: BASE_AMOUNT.mul(100)
        };
    }

    describe('minting', () => {
        beforeEach(async () => {
            await setupTestPool();
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
            const liquidityAmount = BASE_AMOUNT.mul(10); // 10x base amount for testing
            
            // Mint tokens with extra buffer
            await token0.mint(owner.address, liquidityAmount.mul(100));
            await token1.mint(owner.address, liquidityAmount.mul(100));
            
            // Approve tokens
            await token0.approve(pool.address, ethers.constants.MaxUint256);
            await token1.approve(pool.address, ethers.constants.MaxUint256);
            
            // Add liquidity
            await pool.mint(owner.address, MIN_TICK, MAX_TICK, liquidityAmount);

            const position = await pool.getPosition(owner.address, MIN_TICK, MAX_TICK);
            expect(position.liquidity).to.equal(liquidityAmount);
            expect(await pool.liquidity()).to.equal(liquidityAmount);
        });
    });

    describe('swapping', () => {
        const swapAmount = BASE_AMOUNT; // Base amount for swaps
        const lpAmount = BASE_AMOUNT.mul(100); // 100x base amount for liquidity
        
        beforeEach(async () => {
            await setupTestPool();
            
            // Mint tokens for LP with extra buffer
            await token0.mint(owner.address, lpAmount.mul(1000));
            await token1.mint(owner.address, lpAmount.mul(1000));
            
            // Mint tokens for swapper with extra buffer
            await token0.mint(other.address, swapAmount.mul(1000));
            await token1.mint(other.address, swapAmount.mul(1000));
            
            // Approve tokens
            await token0.approve(pool.address, ethers.constants.MaxUint256);
            await token1.approve(pool.address, ethers.constants.MaxUint256);
            await token0.connect(other).approve(pool.address, ethers.constants.MaxUint256);
            await token1.connect(other).approve(pool.address, ethers.constants.MaxUint256);
            
            // Add liquidity
            await pool.mint(owner.address, MIN_TICK, MAX_TICK, lpAmount);
        });

        it('executes swap zero for one', async () => {
            const initialBalance0 = await token0.balanceOf(other.address);
            const initialBalance1 = await token1.balanceOf(other.address);
            
            // Execute swap
            await pool.connect(other).swap(true, swapAmount, other.address);
            
            const finalBalance0 = await token0.balanceOf(other.address);
            const finalBalance1 = await token1.balanceOf(other.address);
            
            // Verify token transfers
            expect(initialBalance0.sub(finalBalance0)).to.equal(swapAmount);
            expect(finalBalance1.sub(initialBalance1)).to.be.gt(0); // Should receive some token1 minus fee
            
            const { sqrtPriceX96, tick } = await pool.slot0();
            expect(sqrtPriceX96).to.be.lt(SQRT_PRICE_X96);
            expect(tick).to.be.lt(0);
        });

        it('executes swap one for zero', async () => {
            const initialBalance0 = await token0.balanceOf(other.address);
            const initialBalance1 = await token1.balanceOf(other.address);
            
            // Execute swap
            await pool.connect(other).swap(false, swapAmount, other.address);
            
            const finalBalance0 = await token0.balanceOf(other.address);
            const finalBalance1 = await token1.balanceOf(other.address);
            
            // Verify token transfers
            expect(finalBalance0.sub(initialBalance0)).to.be.gt(0); // Should receive some token0 minus fee
            expect(initialBalance1.sub(finalBalance1)).to.equal(swapAmount);
            
            const { sqrtPriceX96, tick } = await pool.slot0();
            expect(sqrtPriceX96).to.be.gt(SQRT_PRICE_X96);
            expect(tick).to.be.gt(0);
        });

        it('collects fees', async () => {
            // Execute swap
            await pool.connect(other).swap(true, swapAmount, other.address);

            // Check initial balance
            const initialBalance0 = await token0.balanceOf(owner.address);
            
            // Collect fees
            await pool.collect(owner.address, MIN_TICK, MAX_TICK);
            
            // Check final balance
            const finalBalance0 = await token0.balanceOf(owner.address);
            const expectedFees = swapAmount.mul(3).div(1000); // 0.3% of swap amount
            
            expect(finalBalance0.sub(initialBalance0)).to.be.gt(0); // Should collect some fees
        });
    });
});
