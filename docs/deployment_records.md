# Deployment Records

# Deployment Records

## Latest Deployments (February 20, 2025)

### Core Contracts
- Factory: 0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347
- PositionManager: 0x7f94440f5CB70c496C054DB50c3f0f5414AD8216
- UniswapV3MintCallback: Deployed with PositionManager

### Test Tokens
- TT1: 0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9
- TT2: 0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122

### Pool Deployments
- TT1/TT2 Pool: 0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347
  - Fee Tier: 3000
  - Initial Price: 1:1 (sqrtPriceX96: 79228162514264337593543950336)
  - Current Liquidity: 100500000000000000000
  - Token Balances:
    - TT1: 0.301033173069033485
    - TT2: 0.301033173069033485

## Deployment History

### February 20, 2025 - Position Management Update
- Deployed PositionManager contract (0x7f94440f5CB70c496C054DB50c3f0f5414AD8216)
  - Added secure position tracking with unique keys
  - Implemented proper token approval flow
  - Enhanced callback handling for liquidity addition

- TT1/TT2 Pool Updates
  - Successfully added initial liquidity
  - Verified token transfers and balances
  - Confirmed position tracking functionality
  - Pool initialized with 1:1 price ratio

- Contract Enhancements
  - Added UniswapV3MintCallback for secure token transfers
  - Enhanced TransferHelper with improved error handling
  - Updated position key calculation to include pool address
  - Implemented proper liquidity tracking

### Contract Verification Status
- All contracts have been deployed to Tura blockchain (Chain ID: 1337)
- RPC Endpoint: https://rpc-beta1.turablockchain.com
- Contracts verified and operational
