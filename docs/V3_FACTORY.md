# Uniswap V3 Factory Implementation

## Overview
The Tura DEX implements the official Uniswap V3 factory contract for pool creation and management. The factory contract is responsible for:
- Creating new liquidity pools
- Managing fee tiers
- Validating token pairs
- Emitting pool creation events

## Contract Details
- Address: 0xC2EdBdd3394dA769De72986d06b0C28Ba991341d
- Implementation: Official Uniswap V3
- Owner: 0x08Bb6eA809A2d6c13D57166Fa3ede48C0ae9a70e

## Fee Tiers
The factory supports three standard fee tiers:
1. 0.05% (500) - Best for stable pairs
   - Tick Spacing: 10
2. 0.3% (3000) - Best for most pairs
   - Tick Spacing: 60
3. 1% (10000) - Best for exotic pairs
   - Tick Spacing: 200

## Pool Creation
Pools are created through the factory contract using:
```solidity
function createPool(
    address tokenA,
    address tokenB,
    uint24 fee
) external returns (address pool)
```

The factory:
1. Validates token addresses (tokenA != tokenB)
2. Orders tokens (token0 < token1)
3. Verifies fee tier
4. Creates pool
5. Emits PoolCreated event

## Events
The PoolCreated event is emitted on successful pool creation:
```solidity
event PoolCreated(
    address indexed token0,
    address indexed token1,
    uint24 indexed fee,
    int24 tickSpacing,
    address pool
)
```

## Integration
Frontend integration is handled through:
- contracts.ts for address management
- AddLiquidityModal.tsx for pool creation
- Proper event handling and error management
