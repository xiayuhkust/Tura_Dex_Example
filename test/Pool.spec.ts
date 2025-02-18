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

        // Create pool
        await factory.createPool(token0.address, token1.address, FEE);
        const poolAddress = await factory.getPool(token0.address, token1.address, FEE);
        pool = await ethers.getContractAt('UniswapV3Pool', poolAddress);

        // Setup initial amounts - using minimal amounts for Tura testing
        const userAmount = ethers.utils.parseEther('0.0000001'); // 0.0000001 Tura for testing
        const lpAmount = ethers.utils.parseEther('0.00000005'); // 0.00000005 Tura for LP
            
        // Mint tokens first
        await token0.mint(owner.address, userAmount.mul(2));
        await token1.mint(owner.address, userAmount.mul(2));
        await token0.mint(other.address, userAmount);
        await token1.mint(other.address, userAmount);
            
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

    describe('minting', () => {
        beforeEach(async () => {
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
            // Initialize pool first
            await pool.initialize(SQRT_PRICE_X96);
            
            // Add initial liquidity
            // Setup initial amounts - using minimal amounts for Tura testing
            const userAmount = ethers.utils.parseEther('0.00000001'); // 0.00000001 Tura for testing
            const lpAmount = ethers.utils.parseEther('0.000000005'); // 0.000000005 Tura for LP
            
            // Mint tokens first
            await token0.mint(owner.address, userAmount.mul(2));
            await token1.mint(owner.address, userAmount.mul(2));
            
            // Verify initial balances
            const initialBalance0 = await token0.balanceOf(owner.address);
            const initialBalance1 = await token1.balanceOf(owner.address);
            expect(initialBalance0).to.be.gt(0, "Owner should have token0");
            expect(initialBalance1).to.be.gt(0, "Owner should have token1");
            
            // Mint and approve tokens for liquidity provider
            await token0.mint(owner.address, userAmount.mul(2));
            await token1.mint(owner.address, userAmount.mul(2));
            await token0.approve(pool.address, userAmount.mul(2));
            await token1.approve(pool.address, userAmount.mul(2));
            
            // Transfer tokens to pool for initial liquidity
            await token0.transfer(pool.address, lpAmount);
            await token1.transfer(pool.address, lpAmount);
            
            // Add initial liquidity
            await pool.mint(owner.address, MIN_TICK, MAX_TICK, lpAmount);
            
            // Mint and approve tokens for trader
            await token0.mint(other.address, userAmount);
            await token1.mint(other.address, userAmount);
            await token0.connect(other).approve(pool.address, userAmount);
            await token1.connect(other).approve(pool.address, userAmount);
            
            // Verify balances
            const ownerBalance0 = await token0.balanceOf(owner.address);
            const ownerBalance1 = await token1.balanceOf(owner.address);
            const otherBalance0 = await token0.balanceOf(other.address);
            const otherBalance1 = await token1.balanceOf(other.address);
            
            expect(ownerBalance0).to.be.gt(0, "Owner token0 balance should be positive");
            expect(ownerBalance1).to.be.gt(0, "Owner token1 balance should be positive");
            expect(otherBalance0).to.be.gt(0, "Trader token0 balance should be positive");
            expect(otherBalance1).to.be.gt(0, "Trader token1 balance should be positive");
        });

        it('executes swap zero for one', async () => {
            const swapAmount = ethers.utils.parseEther('0.0000001'); // 0.0000001 Tura for swap
            
            // Verify trader has enough tokens
            const traderBalance0 = await token0.balanceOf(other.address);
            expect(traderBalance0).to.be.gte(swapAmount, "Trader should have enough token0");
            
            // Approve tokens first
            await token0.connect(other).approve(pool.address, swapAmount);
            
            // Get initial balances
            const initialBalance0 = await token0.balanceOf(other.address);
            const initialBalance1 = await token1.balanceOf(other.address);
            const initialPoolBalance0 = await token0.balanceOf(pool.address);
            const initialPoolBalance1 = await token1.balanceOf(pool.address);
            
            // Calculate expected amounts
            const feeAmount = swapAmount.mul(3).div(1000); // 0.3% fee first
            const amountAfterFee = swapAmount.sub(feeAmount); // Remainder is output
            
            // Execute swap
            await pool.connect(other).swap(true, swapAmount, other.address);
            
            // Verify balances changed correctly
            const finalBalance0 = await token0.balanceOf(other.address);
            const finalBalance1 = await token1.balanceOf(other.address);
            const finalPoolBalance0 = await token0.balanceOf(pool.address);
            const finalPoolBalance1 = await token1.balanceOf(pool.address);
            
            // Verify token0 was taken from user
            expect(finalBalance0).to.equal(initialBalance0.sub(swapAmount), "User token0 balance incorrect");
            // Verify token1 was given to user
            expect(finalBalance1).to.equal(initialBalance1.add(amountAfterFee), "User token1 balance incorrect");
            // Verify pool balances changed correctly
            expect(finalPoolBalance0).to.equal(initialPoolBalance0.add(swapAmount), "Pool token0 balance incorrect");
            expect(finalPoolBalance1).to.equal(initialPoolBalance1.sub(amountAfterFee), "Pool token1 balance incorrect");
            
            // Verify fee growth and protocol fees
            const position = await pool.getPosition(owner.address, MIN_TICK, MAX_TICK);
            expect(position.tokensOwed0).to.be.gt(0, "Fee growth incorrect");
            expect(await pool.protocolFees0()).to.equal(feeAmount);
        });

        it('executes swap one for zero', async () => {
            const swapAmount = ethers.utils.parseEther('0.00000001'); // 0.00000001 Tura for swap testing (trader has ~40)
            // Approve tokens first
            await token1.connect(other).approve(pool.address, swapAmount);
            
            // Get initial balances
            const initialBalance0 = await token0.balanceOf(other.address);
            const initialBalance1 = await token1.balanceOf(other.address);
            const initialPoolBalance0 = await token0.balanceOf(pool.address);
            const initialPoolBalance1 = await token1.balanceOf(pool.address);
            
            // Calculate expected amounts
            const feeAmount = swapAmount.mul(3).div(1000); // 0.3% fee first
            const amountAfterFee = swapAmount.sub(feeAmount); // Remainder is output
            
            // Execute swap
            await pool.connect(other).swap(false, swapAmount, other.address);
            
            // Verify balances changed correctly
            const finalBalance0 = await token0.balanceOf(other.address);
            const finalBalance1 = await token1.balanceOf(other.address);
            const finalPoolBalance0 = await token0.balanceOf(pool.address);
            const finalPoolBalance1 = await token1.balanceOf(pool.address);
            
            // Verify token1 was taken from user
            expect(finalBalance1).to.equal(initialBalance1.sub(swapAmount), "User token1 balance incorrect");
            // Verify token0 was given to user
            expect(finalBalance0).to.equal(initialBalance0.add(amountAfterFee), "User token0 balance incorrect");
            // Verify pool balances changed correctly
            expect(finalPoolBalance0).to.equal(initialPoolBalance0.sub(amountAfterFee), "Pool token0 balance incorrect");
            expect(finalPoolBalance1).to.equal(initialPoolBalance1.add(swapAmount), "Pool token1 balance incorrect");
            
            // Verify fee growth
            const position = await pool.getPosition(owner.address, MIN_TICK, MAX_TICK);
            expect(position.tokensOwed1).to.be.gt(0, "Fee growth incorrect");
            
            // Verify protocol fees
            expect(await pool.protocolFees1()).to.equal(feeAmount);
        });

        it('collects fees', async () => {
            const swapAmount = ethers.utils.parseEther('0.00000001'); // 0.00000001 Tura for swap testing (trader has ~40)
            
            // Approve tokens for swap
            await token0.connect(other).approve(pool.address, swapAmount);
            
            // Execute swap to accumulate fees
            await pool.connect(other).swap(true, swapAmount, other.address);
            
            // Approve more tokens for second swap
            await token0.connect(other).approve(pool.address, swapAmount);
            await pool.connect(other).swap(true, swapAmount, other.address);
            
            // Calculate expected fee for two swaps
            const expectedFees = swapAmount.mul(3).div(1000).mul(2); // 0.3% fee * 2 swaps
            
            // Get initial balances
            const initialBalance0 = await token0.balanceOf(owner.address);
            
            // Collect fees
            await pool.collect(owner.address, MIN_TICK, MAX_TICK);
            
            // Get final balances
            const finalBalance0 = await token0.balanceOf(owner.address);
            
            // Verify fees were collected
            expect(finalBalance0.sub(initialBalance0)).to.equal(expectedFees, "Fee collection incorrect");
        });
    });
});
