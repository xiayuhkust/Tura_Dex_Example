# Tura DEX Deployment Records

## Network Information
- Chain ID: 1337
- RPC URL: https://rpc-beta1.turablockchain.com
- Owner Address: 0x08Bb6eA809A2d6c13D57166Fa3ede48C0ae9a70e

## Core Contracts

### WETH (TuraWETH)
- Address: 0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be
- Symbol: WTURA
- Description: Wrapped Tura implementation
- Features:
  * ERC20 compliant
  * Deposit/Withdraw native Tura
  * 18 decimals
- Deployment Date: February 19, 2025

### Test Tokens
1. Test Token 1 (TT1)
   - Address: 0xf7430841c1917Fee24B04dBbd0b809F36E5Ad716
   - Symbol: TT1
   - Initial Supply: 1,000,000 tokens
   - Decimals: 18

2. Test Token 2 (TT2)
   - Address: 0x3Cbc85319E3D9d6b29DDe06f591017e9f9666652
   - Symbol: TT2
   - Initial Supply: 1,000,000 tokens
   - Decimals: 18

### TuraFactory
- Address: 0x511CE2380a70bE66FAf44a5baaBf11E92D654905
- Features:
  * Pool creation
  * Fee configuration
  * Owner management
- Default Fee Tiers:
  * 0.3% (3000)
  * 0.5% (5000)
  * 1.0% (10000)
- Math Libraries:
  * TickMath: 0x2BCfd70627278DD03aCE47F210D3a92B98CFeBBb
  * SqrtPriceMath: 0xa04272fE53Ec20569B4A8503115c697eF5f5B582
  * Position: 0xB8eaDF519486e469A302b2DEDA73dAA3616d46CB
  * FullMath: 0x685CAA8E97452AD3bC1345DD2227729fFe412b33

## Peripheral Contracts

### SwapRouter
- Address: 0xB492Bf5FBfA79364149CC76B77b8bd78BecD1416
- Features:
  * Single hop swaps
  * Multi-hop swaps
  * ETH/WETH handling

### NonfungiblePositionManager
- Address: 0x6Ba55510435288424053d8924450Bb1269fD3BD2
- Features:
  * ERC721 compliant
  * Liquidity position management
  * Fee collection
- Token Name: "Tura Liquidity"
- Token Symbol: "TURA-LP"

## Test Pools
- WETH/TestToken1 Pool (0.3%): 0x47cC776b736B5898de24011909dDe0E91e41f88E

## Deployment History
1. Math Libraries (2025-02-17)
   - Deployed core math libraries for price and position calculations
2. Factory Contract (2025-02-17)
   - Deployed TuraFactory with support for multiple fee tiers
3. Periphery Contracts (2025-02-17)
   - Deployed SwapRouter for token swaps
   - Deployed NonfungiblePositionManager for LP token management
4. Test Pool Creation (2025-02-17)
   - Created WETH/TestToken1 pool with 0.3% fee
   - Initialized with 1:1 price ratio
   - Added initial liquidity across multiple ranges
