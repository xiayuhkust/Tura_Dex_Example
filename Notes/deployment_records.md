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
   - Address: 0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9
   - Symbol: TT1
   - Initial Supply: 1,000,000 tokens
   - Decimals: 18

2. Test Token 2 (TT2)
   - Address: 0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122
   - Symbol: TT2
   - Initial Supply: 1,000,000 tokens
   - Decimals: 18

### UniswapV3Factory
- Address: 0xC2EdBdd3394dA769De72986d06b0C28Ba991341d
- Deployment Date: February 19, 2025
- Implementation: Official Uniswap V3
- Status: Active
- Owner: 0x08Bb6eA809A2d6c13D57166Fa3ede48C0ae9a70e
- Features:
  * Pool creation and management
  * Fee tier configuration
  * Owner management
  * NoDelegateCall protection (verified)
- Fee Tiers:
  * 0.05% (500) - Tick Spacing: 10
  * 0.3% (3000) - Tick Spacing: 60
  * 1.0% (10000) - Tick Spacing: 200
- Core Dependencies:
  * UniswapV3PoolDeployer (integrated)
  * NoDelegateCall (integrated)

## Peripheral Contracts

### SwapRouter
- Address: 0xAC15BD2b9CfC37AA3a2aC78CD41a7abF33476F19
- Deployment Date: February 20, 2025
- Features:
  * Single hop swaps
  * Multi-hop swaps
  * ETH/WETH handling
- Dependencies:
  * Factory: 0xC2EdBdd3394dA769De72986d06b0C28Ba991341d
  * WETH: 0xc8F7d7989a409472945b00177396f4e9b8601DF3

### NonfungibleTokenPositionDescriptor
- Address: 0xF6F59FF948F589bcA48295Be1Df1fD202FE5EeD8
- Deployment Date: February 20, 2025
- Dependencies:
  * NFTDescriptor Library: 0x0297b528164dE6eeB0543DED5CBC8048eaf7c1D2
  * WETH: 0xc8F7d7989a409472945b00177396f4e9b8601DF3

### NonfungiblePositionManager
- Address: 0x90B834B3027Cd62c76FdAF1c22B21D1D8a2Cc965
- Deployment Date: February 20, 2025
- Features:
  * ERC721 compliant
  * Liquidity position management
  * Fee collection
- Token Name: "Tura Liquidity"
- Token Symbol: "TURA-LP"
- Dependencies:
  * Factory: 0xC2EdBdd3394dA769De72986d06b0C28Ba991341d
  * WETH: 0xc8F7d7989a409472945b00177396f4e9b8601DF3
  * Position Descriptor: 0xF6F59FF948F589bcA48295Be1Df1fD202FE5EeD8

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
5. V3 Periphery Redeployment (2025-02-20)
   - Deployed NFTDescriptor library at 0x0297b528164dE6eeB0543DED5CBC8048eaf7c1D2
   - Deployed NonfungibleTokenPositionDescriptor at 0xF6F59FF948F589bcA48295Be1Df1fD202FE5EeD8
   - Deployed NonfungiblePositionManager at 0x90B834B3027Cd62c76FdAF1c22B21D1D8a2Cc965
   - Deployed SwapRouter at 0xAC15BD2b9CfC37AA3a2aC78CD41a7abF33476F19
   - Verified all contract deployments and dependencies

6. Architectural Decisions (2025-02-20)
   - Decided not to deploy V3Migrator contract as this is a fresh V3-only deployment
   - No V2 infrastructure required
   - Focus on direct V3 liquidity provision without migration path
