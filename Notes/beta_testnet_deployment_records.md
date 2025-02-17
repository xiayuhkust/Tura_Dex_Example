# Tura DEX Beta Testnet Deployment Records

## Network Information
- Chain ID: 1337
- RPC URL: https://rpc-beta1.turablockchain.com

## Deployment Status
Awaiting deployment. The following contracts will be deployed:

### Core Contracts
1. Math Libraries
   - TickMath
   - SqrtPriceMath
   - Position
   - FullMath

2. WETH9
   - Description: Wrapped ETH implementation for Tura chain
   - Features:
     * ERC20 compliant
     * Deposit/Withdraw native ETH
     * 18 decimals

3. Test Tokens
   - Test Token 1 (TT1)
     * Symbol: TT1
     * Initial Supply: 1,000,000 tokens
     * Decimals: 18
   - Test Token 2 (TT2)
     * Symbol: TT2
     * Initial Supply: 1,000,000 tokens
     * Decimals: 18

4. TuraFactory
   - Features:
     * Pool creation
     * Fee configuration
     * Owner management
   - Default Fee Tiers:
     * 0.3% (3000)
     * 0.5% (5000)
     * 1.0% (10000)

### Peripheral Contracts
1. SwapRouter
   - Features:
     * Single hop swaps
     * Multi-hop swaps
     * ETH/WETH handling

2. NonfungiblePositionManager
   - Features:
     * ERC721 compliant
     * Liquidity position management
     * Fee collection
   - Token Name: "Tura Liquidity"
   - Token Symbol: "TURA-LP"

## Deployment History
Pending deployment - awaiting private key configuration.
