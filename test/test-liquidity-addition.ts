import { ethers } from 'ethers';
const CONTRACT_ADDRESSES = {
  WETH: '0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be',
  FACTORY: '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d',
  ROUTER: '0xAC15BD2b9CfC37AA3a2aC78CD41a7abF33476F19',
  POSITION_MANAGER: '0x90B834B3027Cd62c76FdAF1c22B21D1D8a2Cc965',
  TEST_TOKEN_1: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
  TEST_TOKEN_2: '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122'
};

// Token amounts with 18 decimals (1.0 tokens)
const AMOUNT_WITH_DECIMALS = ethers.utils.parseUnits('1.0', 18);

async function main() {
  // Connect to Tura network
  const provider = new ethers.providers.JsonRpcProvider(process.env.TURA_RPC_URL || 'https://rpc-beta1.turablockchain.com');
  if (!process.env.PRIVATE_KEYS) {
    throw new Error('PRIVATE_KEYS environment variable is required');
  }
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEYS, provider);
  
  // Get contract instances
  const tokenAbi = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function mint(address to, uint256 amount) public',
    'function approve(address spender, uint256 amount) external returns (bool)'
  ];
  
  const token0 = new ethers.Contract(CONTRACT_ADDRESSES.TEST_TOKEN_1, tokenAbi, wallet);
  const token1 = new ethers.Contract(CONTRACT_ADDRESSES.TEST_TOKEN_2, tokenAbi, wallet);

  // Mint test tokens
  const mintAmount = ethers.utils.parseUnits('1000', 18);
  console.log('Minting test tokens...');
  await token0.mint(wallet.address, mintAmount);
  await token1.mint(wallet.address, mintAmount);
  console.log('Minted test tokens');
  
  // Get initial balances
  const initialBalance0 = await token0.balanceOf(wallet.address);
  const initialBalance1 = await token1.balanceOf(wallet.address);
  console.log('Initial balances:', {
    TT1: ethers.utils.formatUnits(initialBalance0, 18),
    TT2: ethers.utils.formatUnits(initialBalance1, 18)
  });

  // Approve tokens for position manager
  const positionManagerAbi = [
    'function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external returns (address pool)',
    'function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
    'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)'
  ];
  
  const positionManager = new ethers.Contract(
    CONTRACT_ADDRESSES.POSITION_MANAGER,
    positionManagerAbi,
    wallet
  );

  console.log('Approving tokens...');
  const approve0Tx = await token0.approve(CONTRACT_ADDRESSES.POSITION_MANAGER, AMOUNT_WITH_DECIMALS);
  await approve0Tx.wait();
  const approve1Tx = await token1.approve(CONTRACT_ADDRESSES.POSITION_MANAGER, AMOUNT_WITH_DECIMALS);
  await approve1Tx.wait();
  console.log('Tokens approved');
  
  // Get pool contract
  const factory = new ethers.Contract(
    CONTRACT_ADDRESSES.FACTORY,
    [
      'function getPool(address,address,uint24) view returns (address)',
      'function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)'
    ],
    wallet
  );
  
  // Create and initialize pool if needed
  console.log('Creating and initializing pool if needed...');
  const sqrtPriceX96 = ethers.BigNumber.from('79228162514264337593543950336');  // 1:1 price ratio
  
  // Get pool address from factory
  let poolAddress = await factory.getPool(
    CONTRACT_ADDRESSES.TEST_TOKEN_1,
    CONTRACT_ADDRESSES.TEST_TOKEN_2,
    3000
  );
  console.log('Initial pool address:', poolAddress);

  if (poolAddress === '0x0000000000000000000000000000000000000000') {
    console.log('Creating new pool...');
    try {
      const tx = await positionManager.createAndInitializePoolIfNecessary(
        CONTRACT_ADDRESSES.TEST_TOKEN_1,
        CONTRACT_ADDRESSES.TEST_TOKEN_2,
        3000,
        sqrtPriceX96,
        { gasLimit: 5000000 }
      );
      const receipt = await tx.wait();
      console.log('Pool initialization transaction:', receipt.transactionHash);
      
      poolAddress = await factory.getPool(
        CONTRACT_ADDRESSES.TEST_TOKEN_1,
        CONTRACT_ADDRESSES.TEST_TOKEN_2,
        3000
      );
      console.log('New pool created at:', poolAddress);
    } catch (err) {
      console.error('Error creating pool:', err);
      throw err;
    }
  } else {
    console.log('Pool already exists');
  }
  
  // Calculate tick range for concentrated liquidity
  const tickSpacing = 60; // Medium fee tier
  const tickLower = -tickSpacing;
  const tickUpper = tickSpacing;

  // Check pool state
  const pool = new ethers.Contract(
    poolAddress,
    [
      'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
      'function liquidity() external view returns (uint128)'
    ],
    wallet
  );
  
  const [sqrtPrice, tick] = await pool.slot0();
  const liquidity = await pool.liquidity();
  console.log('Pool state:', {
    sqrtPrice: sqrtPrice.toString(),
    tick: tick.toString(),
    liquidity: liquidity.toString()
  });

  // Add liquidity
  console.log('Adding liquidity...');
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

  try {
    // Ensure token order matches pool order
    const [token0, token1] = CONTRACT_ADDRESSES.TEST_TOKEN_1.toLowerCase() < CONTRACT_ADDRESSES.TEST_TOKEN_2.toLowerCase()
      ? [CONTRACT_ADDRESSES.TEST_TOKEN_1, CONTRACT_ADDRESSES.TEST_TOKEN_2]
      : [CONTRACT_ADDRESSES.TEST_TOKEN_2, CONTRACT_ADDRESSES.TEST_TOKEN_1];

    const params = {
      token0,
      token1,
      fee: 3000,
      tickLower,
      tickUpper,
      amount0Desired: AMOUNT_WITH_DECIMALS,
      amount1Desired: AMOUNT_WITH_DECIMALS,
      amount0Min: 0,
      amount1Min: 0,
      recipient: wallet.address,
      deadline
    };
    console.log('Mint params:', JSON.stringify(params, null, 2));
    
    const tx = await positionManager.mint([params], { gasLimit: 5000000 });
    console.log('Waiting for transaction...');
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.transactionHash);
    console.log('Liquidity added');
  } catch (err) {
    console.error('Error adding liquidity:', err);
    throw err;
  }

  // Get final balances
  const finalBalance0 = await token0.balanceOf(wallet.address);
  const finalBalance1 = await token1.balanceOf(wallet.address);
  console.log('Final balances:', {
    TT1: ethers.utils.formatUnits(finalBalance0, 18),
    TT2: ethers.utils.formatUnits(finalBalance1, 18)
  });

  // Get pool balances
  const poolBalance0 = await token0.balanceOf(poolAddress);
  const poolBalance1 = await token1.balanceOf(poolAddress);
  console.log('Pool balances:', {
    TT1: ethers.utils.formatUnits(poolBalance0, 18),
    TT2: ethers.utils.formatUnits(poolBalance1, 18)
  });

  // Verify token deduction
  const token0Deducted = initialBalance0.sub(finalBalance0);
  const token1Deducted = initialBalance1.sub(finalBalance1);
  console.log('Tokens deducted:', {
    TT1: ethers.utils.formatUnits(token0Deducted, 18),
    TT2: ethers.utils.formatUnits(token1Deducted, 18)
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
