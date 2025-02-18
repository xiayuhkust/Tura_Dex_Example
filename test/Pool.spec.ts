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
    });

    describe('initialization', () => {
        beforeEach(async () => {
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

    async function setupTestPool() {
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

        // Approve tokens
        await token0.approve(pool.address, ethers.constants.MaxUint256);
        await token1.approve(pool.address, ethers.constants.MaxUint256);
        await token0.connect(other).approve(pool.address, ethers.constants.MaxUint256);
        await token1.connect(other).approve(pool.address, ethers.constants.MaxUint256);

        // Setup initial amounts - using minimal amounts for Tura testing
        const lpAmount = ethers.utils.parseEther('0.0000001'); // 0.0000001 Tura for LP
        const userAmount = ethers.utils.parseEther('0.00000001'); // 0.00000001 Tura for testing
        
        // Mint tokens first - mint exact amounts needed
        await token0.mint(owner.address, lpAmount);
        await token1.mint(owner.address, lpAmount);
        await token0.mint(other.address, userAmount);
        await token1.mint(other.address, userAmount);

        // Verify token balances
        const ownerBalance0 = await token0.balanceOf(owner.address);
        const ownerBalance1 = await token1.balanceOf(owner.address);
        const otherBalance0 = await token0.balanceOf(other.address);
        const otherBalance1 = await token1.balanceOf(other.address);

        console.log('Owner balances:', ethers.utils.formatEther(ownerBalance0), ethers.utils.formatEther(ownerBalance1));
        console.log('Other balances:', ethers.utils.formatEther(otherBalance0), ethers.utils.formatEther(otherBalance1));

        return { userAmount, lpAmount };
    }

    describe('minting', () => {
        beforeEach(async () => {
            await setupTestPool();
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
            const liquidityAmount = ethers.utils.parseEther('0.0000001'); // Small amount for testing
            
            // Mint tokens first
            await token0.mint(owner.address, liquidityAmount);
            await token1.mint(owner.address, liquidityAmount);
            
            // Approve tokens
            await token0.approve(pool.address, liquidityAmount);
            await token1.approve(pool.address, liquidityAmount);
            
            // Add liquidity
            await pool.mint(owner.address, MIN_TICK, MAX_TICK, liquidityAmount);

            const position = await pool.getPosition(owner.address, MIN_TICK, MAX_TICK);
            expect(position.liquidity).to.equal(liquidityAmount);
            expect(await pool.liquidity()).to.equal(liquidityAmount);
        });
    });

    describe('swapping', () => {
        beforeEach(async () => {
            const { lpAmount } = await setupTestPool();
            await pool.initialize(SQRT_PRICE_X96);
            
            // Mint tokens for LP
            await token0.mint(owner.address, lpAmount);
            await token1.mint(owner.address, lpAmount);
            
            // Approve tokens
            await token0.approve(pool.address, lpAmount);
            await token1.approve(pool.address, lpAmount);
            
            // Add liquidity
            await pool.mint(owner.address, MIN_TICK, MAX_TICK, lpAmount);
        });

        it('executes swap zero for one', async () => {
            const swapAmount = ethers.utils.parseEther('0.00000001'); // Small amount for testing
            const initialBalance0 = await token0.balanceOf(other.address);
            const initialBalance1 = await token1.balanceOf(other.address);
            
            // Approve tokens for swap
            await token0.connect(other).approve(pool.address, swapAmount);
            
            // Execute swap
            await pool.connect(other).swap(true, swapAmount, other.address);
            
            const finalBalance0 = await token0.balanceOf(other.address);
            const finalBalance1 = await token1.balanceOf(other.address);
            
            // Verify token transfers
            expect(initialBalance0.sub(finalBalance0)).to.equal(swapAmount);
            expect(finalBalance1.sub(initialBalance1)).to.equal(swapAmount.mul(997).div(1000)); // 0.3% fee
            
            const { sqrtPriceX96, tick } = await pool.slot0();
            expect(sqrtPriceX96).to.be.lt(SQRT_PRICE_X96);
            expect(tick).to.be.lt(0);
        });

        it('executes swap one for zero', async () => {
            const swapAmount = ethers.utils.parseEther('0.00000001'); // Small amount for testing
            const initialBalance0 = await token0.balanceOf(other.address);
            const initialBalance1 = await token1.balanceOf(other.address);
            
            // Approve tokens for swap
            await token1.connect(other).approve(pool.address, swapAmount);
            
            // Execute swap
            await pool.connect(other).swap(false, swapAmount, other.address);
            
            const finalBalance0 = await token0.balanceOf(other.address);
            const finalBalance1 = await token1.balanceOf(other.address);
            
            // Verify token transfers
            expect(finalBalance0.sub(initialBalance0)).to.equal(swapAmount.mul(997).div(1000)); // 0.3% fee
            expect(initialBalance1.sub(finalBalance1)).to.equal(swapAmount);
            
            const { sqrtPriceX96, tick } = await pool.slot0();
            expect(sqrtPriceX96).to.be.gt(SQRT_PRICE_X96);
            expect(tick).to.be.gt(0);
        });

        it('collects fees', async () => {
            const swapAmount = ethers.utils.parseEther('0.00000001'); // Small amount for testing
            
            // Approve tokens for swap
            await token0.connect(other).approve(pool.address, swapAmount);
            
            // Execute swap
            await pool.connect(other).swap(true, swapAmount, other.address);

            // Check initial balance
            const initialBalance0 = await token0.balanceOf(owner.address);
            
            // Collect fees
            await pool.collect(owner.address, MIN_TICK, MAX_TICK);
            
            // Check final balance
            const finalBalance0 = await token0.balanceOf(owner.address);
            const expectedFees = ethers.utils.parseEther('0.00000000003'); // 0.3% of swap amount
            
            expect(finalBalance0.sub(initialBalance0)).to.equal(expectedFees, "Fee collection incorrect");
        });
    });
});
