import { ethers } from 'hardhat';
import { Contract, ContractReceipt, ContractTransaction, Event } from '@ethersproject/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TickMath } from '../frontend/src/utils/TickMath';
import { LiquidityAmounts } from '../frontend/src/utils/LiquidityAmounts';

// Contract addresses
const CONTRACT_ADDRESSES = {
  TEST_TOKEN_1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
  TEST_TOKEN_2: '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122',
  POOL: '0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347'
};

// Contract ABIs
const tokenAbi = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)'
];

const poolAbi = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
  'function tickSpacing() external view returns (int24)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function mint(address recipient, int24 tickLower, int24 tickUpper, uint128 amount, bytes calldata data) external returns (uint256 amount0, uint256 amount1)',
  'function uniswapV3MintCallback(uint256 amount0Owed, uint256 amount1Owed, bytes calldata data) external',
  'event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)'
];

import { expect } from 'chai';

describe('Pool Liquidity Tests', function() {
  this.timeout(60000); // Set timeout to 60 seconds
  let wallet: SignerWithAddress;
  let token0: Contract;
  let token1: Contract;
  let poolContract: Contract;
  let mintCallbackContract: Contract;

  before(async () => {
    [wallet] = await ethers.getSigners();
    
    // Initialize contracts
    token0 = new Contract(CONTRACT_ADDRESSES.TEST_TOKEN_1, tokenAbi, wallet);
    token1 = new Contract(CONTRACT_ADDRESSES.TEST_TOKEN_2, tokenAbi, wallet);
    poolContract = new Contract(CONTRACT_ADDRESSES.POOL, poolAbi, wallet);

    // Deploy callback contract
    const UniswapV3MintCallback = await ethers.getContractFactory('contracts/test/UniswapV3MintCallback.sol:UniswapV3MintCallback');
    mintCallbackContract = await UniswapV3MintCallback.deploy();
    await mintCallbackContract.deployed();
  });

  it('should add liquidity to the pool', async () => {
    // Get initial balances
    const initialBalance0 = await token0.balanceOf(wallet.address);
    const initialBalance1 = await token1.balanceOf(wallet.address);
    console.log('Initial balances:', {
      TT1: ethers.utils.formatUnits(initialBalance0, 18),
      TT2: ethers.utils.formatUnits(initialBalance1, 18)
    });

    // Verify pool exists and get pool state
    const [sqrtPrice, currentTick, , , , , unlocked] = await poolContract.slot0();
    const poolLiquidity = await poolContract.liquidity();
    const poolToken0 = await poolContract.token0();
    const poolToken1 = await poolContract.token1();
    
    console.log('Pool state:', {
      sqrtPrice: sqrtPrice.toString(),
      currentTick: currentTick.toString(),
      liquidity: poolLiquidity.toString(),
      token0: poolToken0,
      token1: poolToken1,
      unlocked
    });

    // Calculate tick range
    const poolTickSpacing = await poolContract.tickSpacing();
    const tickRangeMultiplier = 10;
    const tickLower = Number(poolTickSpacing) * tickRangeMultiplier * -1;
    const tickUpper = Number(poolTickSpacing) * tickRangeMultiplier;
    
    console.log('Tick range:', {
      tickLower: tickLower.toString(),
      tickUpper: tickUpper.toString()
    });

    // Set token amounts
    const amount0Desired = ethers.utils.parseUnits('10.0', 18);
    const amount1Desired = ethers.utils.parseUnits('10.0', 18);

    // Approve tokens
    console.log('Approving tokens...');
    const approve0Tx = await token0.approve(CONTRACT_ADDRESSES.POOL, amount0Desired);
    await approve0Tx.wait();
    const approve1Tx = await token1.approve(CONTRACT_ADDRESSES.POOL, amount1Desired);
    await approve1Tx.wait();
    console.log('Tokens approved');

    // Calculate liquidity amount
    const currentSqrtPriceX96 = sqrtPrice;
    const lowerSqrtPriceX96 = ethers.BigNumber.from(TickMath.getSqrtRatioAtTick(tickLower));
    const upperSqrtPriceX96 = ethers.BigNumber.from(TickMath.getSqrtRatioAtTick(tickUpper));

    const liquidity = LiquidityAmounts.getLiquidityForAmounts(
      currentSqrtPriceX96,
      lowerSqrtPriceX96,
      upperSqrtPriceX96,
      amount0Desired,
      amount1Desired
    );

    console.log('Calculated liquidity:', {
      amount: liquidity.toString(),
      formatted: ethers.utils.formatUnits(liquidity, 18)
    });

    // Use the already deployed callback contract from before() hook
    console.log('Using callback contract at:', mintCallbackContract.address);

    // Approve tokens for the callback contract
    await token0.approve(mintCallbackContract.address, amount0Desired);
    await token1.approve(mintCallbackContract.address, amount1Desired);

    // Encode callback data
    const mintCallbackData = ethers.utils.defaultAbiCoder.encode(
      ['address', 'address', 'address'],
      [token0.address, token1.address, wallet.address]
    );

    // Add liquidity
    console.log('Adding liquidity...');
    const provider = wallet.provider;
    if (!provider) {
      throw new Error('Provider not available');
    }

    const gasPrice = await provider.getGasPrice();
    let receipt: ContractReceipt;

    const tx = await poolContract.mint(
      wallet.address,
      tickLower,
      tickUpper,
      liquidity,
      mintCallbackData,
      { 
        gasLimit: 5000000,
        gasPrice
      }
    );
    console.log('Transaction sent:', tx.hash);
    
    // Wait for transaction with timeout handling
    try {
      console.log('Waiting for transaction confirmation...');
      receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction confirmation timeout')), 45000)
        )
      ]) as ContractReceipt;
      console.log('Transaction confirmed:', receipt.transactionHash);
    } catch (error) {
      console.error('Transaction failed or timed out:', error);
      throw error;
    }

    // Get mint event details
    const mintEvents = receipt.events?.filter((e: Event) => e.event === 'Mint');
    if (!mintEvents?.length) {
      throw new Error('No Mint event found');
    }
    
    const event = mintEvents[0];
    if (!event.args) {
      throw new Error('Event args missing');
    }

    const mintedAmount0 = event.args.amount0;
    const mintedAmount1 = event.args.amount1;

    console.log('Liquidity added:', {
      liquidity: liquidity.toString(),
      amount0: ethers.utils.formatUnits(mintedAmount0, 18),
      amount1: ethers.utils.formatUnits(mintedAmount1, 18)
    });

    // Verify token deduction
    const finalBalance0 = await token0.balanceOf(wallet.address);
    const finalBalance1 = await token1.balanceOf(wallet.address);
    const token0Deducted = initialBalance0.sub(finalBalance0);
    const token1Deducted = initialBalance1.sub(finalBalance1);

    console.log('Tokens deducted:', {
      TT1: ethers.utils.formatUnits(token0Deducted, 18),
      TT2: ethers.utils.formatUnits(token1Deducted, 18)
    });

    if (token0Deducted.isZero() || token1Deducted.isZero()) {
      throw new Error('Token deduction failed - no tokens were transferred');
    }

      // Verify liquidity was added successfully
      expect(token0Deducted).to.be.gt(0, 'No token0 was deducted');
      expect(token1Deducted).to.be.gt(0, 'No token1 was deducted');
      expect(mintedAmount0).to.equal(token0Deducted, 'Minted amount0 does not match deducted amount');
      expect(mintedAmount1).to.equal(token1Deducted, 'Minted amount1 does not match deducted amount');
    });
});
