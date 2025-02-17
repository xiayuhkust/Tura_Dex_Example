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

        // Initialize pool
        await pool.initialize(SQRT_PRICE_X96);

        // Approve tokens
        await token0.approve(pool.address, ethers.constants.MaxUint256);
        await token1.approve(pool.address, ethers.constants.MaxUint256);
    });

    describe('initialization', () => {
        it('sets initial price', async () => {
            const { sqrtPriceX96, tick } = await pool.slot0();
            expect(sqrtPriceX96).to.equal(SQRT_PRICE_X96);
            expect(tick).to.equal(0);
        });

        it('reverts if already initialized', async () => {
            await expect(pool.initialize(SQRT_PRICE_X96)).to.be.revertedWith('AI');
        });
    });

    describe('minting', () => {
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
            // Add initial liquidity
            // Mint initial liquidity tokens
            const initialAmount = ethers.utils.parseEther('100');
            await token0.mint(owner.address, initialAmount);
            await token1.mint(owner.address, initialAmount);
            await token0.approve(pool.address, initialAmount);
            await token1.approve(pool.address, initialAmount);
            
            // Add initial liquidity
            const liquidityAmount = ethers.utils.parseEther('1');
            await pool.mint(owner.address, MIN_TICK, MAX_TICK, liquidityAmount);
            
            // Mint initial tokens for both users
            const initialAmount = ethers.utils.parseEther('100');
            await token0.mint(owner.address, initialAmount);
            await token1.mint(owner.address, initialAmount);
            await token0.approve(pool.address, initialAmount);
            await token1.approve(pool.address, initialAmount);
            
            // Add initial liquidity
            const liquidityAmount = ethers.utils.parseEther('10');
            await pool.mint(owner.address, MIN_TICK, MAX_TICK, liquidityAmount);
            
            // Mint tokens for swapping
            await token0.mint(other.address, initialAmount);
            await token1.mint(other.address, initialAmount);
            await token0.connect(other).approve(pool.address, initialAmount);
            await token1.connect(other).approve(pool.address, initialAmount);
        });

        it('executes swap zero for one', async () => {
            const swapAmount = ethers.utils.parseEther('1');
            const expectedFee = swapAmount.mul(3).div(1000); // 0.3% fee
            const amountAfterFee = swapAmount.sub(expectedFee);
            
            // Get initial balances
            const initialBalance0 = await token0.balanceOf(other.address);
            const initialBalance1 = await token1.balanceOf(other.address);
            
            // Execute swap
            await pool.connect(other).swap(true, swapAmount, other.address);
            
            // Verify balances changed correctly
            const finalBalance0 = await token0.balanceOf(other.address);
            const finalBalance1 = await token1.balanceOf(other.address);
            
            expect(initialBalance0.sub(finalBalance0)).to.equal(swapAmount);
            expect(finalBalance1.sub(initialBalance1)).to.equal(amountAfterFee);
        });

        it('executes swap one for zero', async () => {
            const swapAmount = ethers.utils.parseEther('1');
            await token1.approve(pool.address, swapAmount);

            await expect(pool.swap(false, swapAmount, owner.address))
                .to.emit(pool, 'Swap')
                .withArgs(
                    owner.address,
                    owner.address,
                    BigNumber.from('0'),
                    -swapAmount,
                    await pool.slot0().sqrtPriceX96,
                    await pool.liquidity(),
                    await pool.slot0().tick
                );
        });

        it('collects fees', async () => {
            const swapAmount = ethers.utils.parseEther('1');
            await pool.swap(true, swapAmount, owner.address);

            const position = await pool.getPosition(owner.address, MIN_TICK, MAX_TICK);
            expect(position.tokensOwed0).to.be.gt(0);
        });
    });
});
