import { ethers } from 'ethers';
import { TickMath } from '../frontend/src/utils/TickMath';
import { LiquidityAmounts } from '../frontend/src/utils/LiquidityAmounts';

// Contract addresses
const CONTRACT_ADDRESSES = {
  WETH: '0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be',
  FACTORY: '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d',
  ROUTER: '0xAC15BD2b9CfC37AA3a2aC78CD41a7abF33476F19',
  POSITION_MANAGER: '0x90B834B3027Cd62c76FdAF1c22B21D1D8a2Cc965',
  TEST_TOKEN_1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
  TEST_TOKEN_2: '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122'
};

// Constants
const FEE_AMOUNT = 3000; // 0.3%
const AMOUNT_WITH_DECIMALS = ethers.utils.parseUnits('0.1', 18); // Start with smaller amount

// Contract ABIs
const tokenAbi = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function mint(address to, uint256 amount) public',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function owner() view returns (address)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

const positionManagerAbi = [
  'function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external returns (address pool)',
  'function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
  'event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'function factory() external view returns (address)',
  'function WETH9() external view returns (address)',
  'function POOL_INIT_CODE_HASH() external view returns (bytes32)'
];

const factoryAbi = [
  'function getPool(address,address,uint24) view returns (address)',
  'function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)'
];

const poolAbi = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
  'function tickSpacing() external view returns (int24)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function mint(address recipient, int24 tickLower, int24 tickUpper, uint128 amount, bytes calldata data) external returns (uint256 amount0, uint256 amount1)',
  'function uniswapV3MintCallback(uint256 amount0Owed, uint256 amount1Owed, bytes calldata data) external'
];

async function main() {
  try {
    // Connect to Tura network
    const provider = new ethers.providers.JsonRpcProvider(process.env.TURA_RPC_URL || 'https://rpc-beta1.turablockchain.com');
    if (!process.env.PRIVATE_KEYS) {
      throw new Error('PRIVATE_KEYS environment variable is required');
    }
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEYS, provider);

    // Initialize contracts
    const token0 = new ethers.Contract(CONTRACT_ADDRESSES.TEST_TOKEN_1, tokenAbi, wallet);
    const token1 = new ethers.Contract(CONTRACT_ADDRESSES.TEST_TOKEN_2, tokenAbi, wallet);
    const factory = new ethers.Contract(CONTRACT_ADDRESSES.FACTORY, factoryAbi, wallet);
    const positionManager = new ethers.Contract(CONTRACT_ADDRESSES.POSITION_MANAGER, positionManagerAbi, wallet);

    // Check token contracts are deployed
    console.log('Checking token contracts...');
    const code0 = await provider.getCode(token0.address);
    const code1 = await provider.getCode(token1.address);
    if (code0 === '0x' || code1 === '0x') {
      throw new Error('Token contracts not deployed');
    }
    console.log('Token contracts verified');

    // Get initial balances
    const initialBalance0 = await token0.balanceOf(wallet.address);
    const initialBalance1 = await token1.balanceOf(wallet.address);
    console.log('Initial balances:', {
      TT1: ethers.utils.formatUnits(initialBalance0, 18),
      TT2: ethers.utils.formatUnits(initialBalance1, 18)
    });

    // Check permissions and mint tokens if needed
    const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE'));
    const canMint0 = await token0.hasRole(MINTER_ROLE, wallet.address).catch(() => false);
    const canMint1 = await token1.hasRole(MINTER_ROLE, wallet.address).catch(() => false);
    console.log('Minting permissions:', { token0: canMint0, token1: canMint1 });

    if (canMint0 || canMint1) {
      const mintAmount = ethers.utils.parseUnits('1000', 18);
      console.log('Minting test tokens...');

      if (canMint0) {
        console.log('Minting token0...');
        const tx0 = await token0.mint(wallet.address, mintAmount);
        await tx0.wait();
        console.log('Token0 minted');
      }

      if (canMint1) {
        console.log('Minting token1...');
        const tx1 = await token1.mint(wallet.address, mintAmount);
        await tx1.wait();
        console.log('Token1 minted');
      }
    } else {
      console.log('Using existing token balances');
    }

    // Check if pool exists in factory through position manager
    const factoryAddress = await positionManager.factory();
    const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, wallet);
    const existingPoolAddress = await factoryContract.getPool(
      CONTRACT_ADDRESSES.TEST_TOKEN_1,
      CONTRACT_ADDRESSES.TEST_TOKEN_2,
      FEE_AMOUNT
    );
    console.log('Initial pool address:', existingPoolAddress);

    if (existingPoolAddress === ethers.constants.AddressZero) {
      console.log('Creating new pool...');
      const sqrtPriceX96 = ethers.BigNumber.from('79228162514264337593543950336'); // 1:1 price ratio
      const tx = await positionManager.createAndInitializePoolIfNecessary(
        CONTRACT_ADDRESSES.TEST_TOKEN_1,
        CONTRACT_ADDRESSES.TEST_TOKEN_2,
        FEE_AMOUNT,
        sqrtPriceX96,
        { gasLimit: 5000000 }
      );
      const receipt = await tx.wait();
      console.log('Pool initialization transaction:', receipt.transactionHash);
    } else {
      console.log('Pool already exists');
    }

    // Set approvals for NonfungiblePositionManager
    const maxApproval = ethers.constants.MaxUint256;
    // Use very small amounts for testing
    const desiredAmount0 = ethers.utils.parseUnits('10.0', 18);
    const desiredAmount1 = ethers.utils.parseUnits('10.0', 18);
    
    // Check current balances before approval
    const balanceBefore0 = await token0.balanceOf(wallet.address);
    const balanceBefore1 = await token1.balanceOf(wallet.address);
    console.log('Balances before approval:', {
      token0: ethers.utils.formatUnits(balanceBefore0, 18),
      token1: ethers.utils.formatUnits(balanceBefore1, 18)
    });

    console.log(`Setting approvals for ${CONTRACT_ADDRESSES.POSITION_MANAGER}...`);
    try {
      console.log('Approving token0...');
      // Check current allowances
      const allowances = await Promise.all([
        token0.allowance(wallet.address, CONTRACT_ADDRESSES.POSITION_MANAGER),
        token1.allowance(wallet.address, CONTRACT_ADDRESSES.POSITION_MANAGER),
        token0.allowance(wallet.address, existingPoolAddress),
        token1.allowance(wallet.address, existingPoolAddress),
        token0.allowance(wallet.address, CONTRACT_ADDRESSES.FACTORY),
        token1.allowance(wallet.address, CONTRACT_ADDRESSES.FACTORY)
      ]);

      console.log('Current allowances:', {
        positionManager: {
          token0: ethers.utils.formatUnits(allowances[0], 18),
          token1: ethers.utils.formatUnits(allowances[1], 18)
        },
        pool: {
          token0: ethers.utils.formatUnits(allowances[2], 18),
          token1: ethers.utils.formatUnits(allowances[3], 18)
        },
        factory: {
          token0: ethers.utils.formatUnits(allowances[4], 18),
          token1: ethers.utils.formatUnits(allowances[5], 18)
        }
      });

      // Approve all contracts that might need it
      const contractsToApprove = [
        CONTRACT_ADDRESSES.POSITION_MANAGER,
        existingPoolAddress,
        CONTRACT_ADDRESSES.FACTORY
      ];

      try {
        // Skip approvals if we already have sufficient allowance
        for (const contract of contractsToApprove) {
          const allowance0 = await token0.allowance(wallet.address, contract);
          const allowance1 = await token1.allowance(wallet.address, contract);
          
          if (allowance0.lt(desiredAmount0)) {
            console.log(`Approving token0 for ${contract}...`);
            const approve0Tx = await token0.approve(contract, maxApproval);
            await approve0Tx.wait();
            console.log(`Token0 approved for ${contract}`);
          }
          
          if (allowance1.lt(desiredAmount1)) {
            console.log(`Approving token1 for ${contract}...`);
            const approve1Tx = await token1.approve(contract, maxApproval);
            await approve1Tx.wait();
            console.log(`Token1 approved for ${contract}`);
          }
        }
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error) {
          if (error.code === 'CALL_EXCEPTION') {
            console.error('Transaction reverted. Possible reasons:');
            console.error('1. Insufficient token balance or allowance');
            console.error('2. Invalid tick range');
            console.error('3. Pool not initialized');
            console.error('4. Callback data encoding issue');
            console.error('Error details:', error);
          }
        }
        throw error;
      }
    } catch (error) {
      console.error('Error during approval:', error);
      throw error;
    }
    
    // Verify approvals
    const [currentAllowance0, currentAllowance1] = await Promise.all([
      token0.allowance(wallet.address, CONTRACT_ADDRESSES.POSITION_MANAGER),
      token1.allowance(wallet.address, CONTRACT_ADDRESSES.POSITION_MANAGER)
    ]);
      
    console.log('Current allowances:', {
      token0: ethers.utils.formatUnits(currentAllowance0, 18),
      token1: ethers.utils.formatUnits(currentAllowance1, 18),
      spender: CONTRACT_ADDRESSES.POSITION_MANAGER
    });

    // Initialize pool contract
    const poolContract = new ethers.Contract(existingPoolAddress, poolAbi, wallet);

    // Get pool state
    const [sqrtPrice, currentTick, observationIndex, observationCardinality, observationCardinalityNext, feeProtocol, unlocked] = await poolContract.slot0();
    const poolLiquidity = await poolContract.liquidity();
    const poolToken0 = await poolContract.token0();
    const poolToken1 = await poolContract.token1();
    
    console.log('Pool state:', {
      sqrtPrice: sqrtPrice.toString(),
      currentTick: currentTick.toString(),
      liquidity: poolLiquidity.toString(),
      token0: poolToken0,
      token1: poolToken1,
      unlocked,
      observationIndex: observationIndex.toString(),
      observationCardinality: observationCardinality.toString(),
      feeProtocol: feeProtocol.toString()
    });

    // Get pool's tick spacing and calculate range
    const poolTickSpacing = await poolContract.tickSpacing();
    console.log('Pool tick spacing:', poolTickSpacing.toString());

    // Calculate tick range based on pool's tick spacing
    const tickRangeMultiplier = 10; // Use 10 spacing units
    const tickLower = Number(poolTickSpacing) * tickRangeMultiplier * -1;
    const tickUpper = Number(poolTickSpacing) * tickRangeMultiplier;
    
    console.log('Tick range:', {
      tickLower: tickLower.toString(),
      tickUpper: tickUpper.toString()
    });
    
    console.log('Pool state:', {
      sqrtPrice: sqrtPrice.toString(),
      currentTick: currentTick.toString(),
      liquidity: poolLiquidity.toString(),
      token0: poolToken0,
      token1: poolToken1,
      unlocked,
      tickLower,
      tickUpper
    });
    
    // Verify ticks
    if (tickLower < TickMath.MIN_TICK || tickUpper > TickMath.MAX_TICK) {
      throw new Error('Ticks out of bounds');
    }

    // Add liquidity
    console.log('Adding liquidity...');
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

    // Ensure token order matches expected order
    const [orderedToken0, orderedToken1] = CONTRACT_ADDRESSES.TEST_TOKEN_1.toLowerCase() < CONTRACT_ADDRESSES.TEST_TOKEN_2.toLowerCase()
      ? [CONTRACT_ADDRESSES.TEST_TOKEN_1, CONTRACT_ADDRESSES.TEST_TOKEN_2]
      : [CONTRACT_ADDRESSES.TEST_TOKEN_2, CONTRACT_ADDRESSES.TEST_TOKEN_1];

    const [orderedAmount0, orderedAmount1] = CONTRACT_ADDRESSES.TEST_TOKEN_1.toLowerCase() < CONTRACT_ADDRESSES.TEST_TOKEN_2.toLowerCase()
      ? [desiredAmount0, desiredAmount1]
      : [desiredAmount1, desiredAmount0];

    if (orderedAmount0.isZero() || orderedAmount1.isZero()) {
      throw new Error('Amount cannot be zero');
    }

    const mintParams = {
      token0: orderedToken0,
      token1: orderedToken1,
      fee: FEE_AMOUNT,
      tickLower,
      tickUpper,
      amount0Desired: orderedAmount0,
      amount1Desired: orderedAmount1,
      amount0Min: orderedAmount0.div(2),
      amount1Min: orderedAmount1.div(2),
      recipient: wallet.address,
      deadline
    };

    console.log('Mint params:', JSON.stringify(mintParams, null, 2));

    // Calculate sqrt price ratios for liquidity calculation
    const currentSqrtPriceX96 = ethers.BigNumber.from('79228162514264337593543950336'); // 1:1 price
    const lowerSqrtPriceX96 = ethers.BigNumber.from(TickMath.getSqrtRatioAtTick(Number(tickLower)));
    const upperSqrtPriceX96 = ethers.BigNumber.from(TickMath.getSqrtRatioAtTick(Number(tickUpper)));

    // Calculate optimal liquidity amount
    const liquidity = LiquidityAmounts.getLiquidityForAmounts(
      currentSqrtPriceX96,
      lowerSqrtPriceX96,
      upperSqrtPriceX96,
      orderedAmount0,
      orderedAmount1
    );

    // Log calculated liquidity
    console.log('Calculated liquidity:', {
      amount: liquidity.toString(),
      formatted: ethers.utils.formatUnits(liquidity, 18)
    });

    // Verify ticks are in range
    if (tickLower >= tickUpper) {
      throw new Error('Lower tick must be less than upper tick');
    }

    console.log('Liquidity calculation:', {
      desiredAmount0: orderedAmount0.toString(),
      desiredAmount1: orderedAmount1.toString(),
      liquidity: liquidity.toString(),
      currentPrice: currentSqrtPriceX96.toString(),
      lowerBound: lowerSqrtPriceX96.toString(),
      upperBound: upperSqrtPriceX96.toString()
    });

    // Add liquidity through NonfungiblePositionManager
    console.log('Adding liquidity through NonfungiblePositionManager...');
    console.log('Minting position...');

    try {
      console.log('Attempting to mint position...');
      // Encode pool key for callback
      const poolKey = {
        token0: orderedToken0,
        token1: orderedToken1,
        fee: FEE_AMOUNT
      };
      const encodedData = ethers.utils.defaultAbiCoder.encode(
        ['(address token0, address token1, uint24 fee)', 'address'],
        [poolKey, wallet.address]
      );

      // Get pool token order
      const poolToken0 = await poolContract.token0();
      const poolToken1 = await poolContract.token1();
      
      // Ensure token order matches pool
      const [amount0Desired, amount1Desired] = poolToken0.toLowerCase() === orderedToken0.toLowerCase() 
        ? [orderedAmount0, orderedAmount1]
        : [orderedAmount1, orderedAmount0];

      console.log('Verifying pool parameters...');
      const [sqrtPrice, tick, observationIndex, observationCardinality, observationCardinalityNext, feeProtocol, unlocked] = await poolContract.slot0();
      console.log('Pool current state:', {
        sqrtPrice: sqrtPrice.toString(),
        tick: tick.toString(),
        tickLower: tickLower.toString(),
        tickUpper: tickUpper.toString(),
        amount0Desired: ethers.utils.formatUnits(amount0Desired, 18),
        amount1Desired: ethers.utils.formatUnits(amount1Desired, 18),
        observationIndex: observationIndex.toString(),
        observationCardinality: observationCardinality.toString(),
        feeProtocol: feeProtocol.toString(),
        unlocked
      });

      // Verify token order and balances
      const token0Address = await poolContract.token0();
      const token1Address = await poolContract.token1();
      console.log('Pool tokens:', {
        token0: token0Address,
        token1: token1Address,
        correctOrder: token0Address.toLowerCase() === orderedToken0.toLowerCase()
      });

      // Encode mint callback data
      const mintCallbackData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address', 'address'],
        [token0.address, token1.address, wallet.address]
      );

      // Add liquidity through pool contract
      const tx = await poolContract.mint(
        wallet.address,
        tickLower,
        tickUpper,
        liquidity,
        mintCallbackData,
        { 
          gasLimit: 5000000,
          gasPrice: await provider.getGasPrice()
        }
      );
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.transactionHash);

      // Get mint event details
      const mintEvents = receipt.events?.filter((e: ethers.Event) => 
        e.event === 'Mint'
      );
      if (!mintEvents?.length) {
        throw new Error('No Mint event found');
      }
      
      const event = mintEvents[0];
      if (!event.args) {
        throw new Error('Event args missing');
      }

      const mintedAmount0 = event.args.amount0 as ethers.BigNumber;
      const mintedAmount1 = event.args.amount1 as ethers.BigNumber;

      console.log('Liquidity added:', {
        liquidity: liquidity.toString(),
        amount0: ethers.utils.formatUnits(mintedAmount0, 18),
        amount1: ethers.utils.formatUnits(mintedAmount1, 18)
      });

      // Get final balances
      const finalBalance0 = await token0.balanceOf(wallet.address);
      const finalBalance1 = await token1.balanceOf(wallet.address);
      console.log('Final balances:', {
        TT1: ethers.utils.formatUnits(finalBalance0, 18),
        TT2: ethers.utils.formatUnits(finalBalance1, 18)
      });

      // Verify token deduction
      const token0Deducted = initialBalance0.sub(finalBalance0);
      const token1Deducted = initialBalance1.sub(finalBalance1);
      console.log('Tokens deducted:', {
        TT1: ethers.utils.formatUnits(token0Deducted, 18),
        TT2: ethers.utils.formatUnits(token1Deducted, 18)
      });

      if (token0Deducted.isZero() || token1Deducted.isZero()) {
        throw new Error('Token deduction failed - no tokens were transferred');
      }

      console.log('Liquidity addition successful');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'CALL_EXCEPTION') {
          console.error('Transaction reverted. Possible reasons:');
          console.error('1. Insufficient token balance or allowance');
          console.error('2. Invalid tick range');
          console.error('3. Pool not initialized');
          console.error('4. Callback data encoding issue');
          console.error('Error details:', error);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

void main().then(() => process.exit(0)).catch((error) => {
  console.error('Error in main:', error);
  process.exit(1);
});
