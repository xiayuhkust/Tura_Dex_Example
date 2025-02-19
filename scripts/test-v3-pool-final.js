const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.providers.JsonRpcProvider('https://rpc-beta1.turablockchain.com');
  const owner = new ethers.Wallet('ad6fb1ceb0b9dc598641ac1cef545a7882b52f5a12d7204d6074762d96a8a474', provider);
  console.log('Testing with account:', owner.address);

  const ADDRESSES = {
    FACTORY: '0xC2EdBdd3394dA769De72986d06b0C28Ba991341d',
    TT1: '0xf7430841c1917Fee24B04dBbd0b809F36E5Ad716',
    TT2: '0x3Cbc85319E3D9d6b29DDe06f591017e9f9666652'
  };

  const FACTORY_ABI = [
    'function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)',
    'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)'
  ];

  const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function approve(address spender, uint256 value) returns (bool)',
    'function mint(address to, uint256 value)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ];

  try {
    // Create contracts
    const factory = new ethers.Contract(ADDRESSES.FACTORY, FACTORY_ABI, owner);
    const tt1 = new ethers.Contract(ADDRESSES.TT1, ERC20_ABI, owner);
    const tt2 = new ethers.Contract(ADDRESSES.TT2, ERC20_ABI, owner);

    // Check initial balances
    const initialTT1Balance = await tt1.balanceOf(owner.address);
    const initialTT2Balance = await tt2.balanceOf(owner.address);
    console.log('Initial TT1 balance:', ethers.utils.formatEther(initialTT1Balance));
    console.log('Initial TT2 balance:', ethers.utils.formatEther(initialTT2Balance));

    // Create pool with 0.3% fee
    console.log('Creating pool with 0.3% fee...');
    const tx = await factory.createPool(ADDRESSES.TT1, ADDRESSES.TT2, 3000);
    console.log('Transaction hash:', tx.hash);

    // Wait for transaction and get event
    const receipt = await tx.wait();
    const event = receipt.events?.find(e => e.event === 'PoolCreated');
    
    if (!event) {
      throw new Error('PoolCreated event not found');
    }

    console.log('Pool created successfully!');
    console.log('Event data:', {
      token0: event.args.token0,
      token1: event.args.token1,
      fee: event.args.fee.toString(),
      tickSpacing: event.args.tickSpacing.toString(),
      pool: event.args.pool
    });

    // Check final balances
    const finalTT1Balance = await tt1.balanceOf(owner.address);
    const finalTT2Balance = await tt2.balanceOf(owner.address);
    console.log('Final TT1 balance:', ethers.utils.formatEther(finalTT1Balance));
    console.log('Final TT2 balance:', ethers.utils.formatEther(finalTT2Balance));
    console.log('TT1 balance change:', ethers.utils.formatEther(finalTT1Balance.sub(initialTT1Balance)));
    console.log('TT2 balance change:', ethers.utils.formatEther(finalTT2Balance.sub(initialTT2Balance)));

    return {
      poolAddress: event.args.pool,
      token0: event.args.token0,
      token1: event.args.token1,
      fee: event.args.fee.toString(),
      tickSpacing: event.args.tickSpacing.toString()
    };
  } catch (error) {
    console.error('Error:', error);
    if (error.data) {
      console.error('Error data:', error.data);
    }
    if (error.transaction) {
      console.error('Error transaction:', error.transaction);
    }
    throw error;
  }
}

main()
  .then((result) => {
    console.log('Test completed successfully:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
