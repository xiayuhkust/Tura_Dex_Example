# AgentSwap Project Overview

## Project Structure

### Smart Contracts
Located in `contracts/`:

#### Core Contracts
- **TuraWETH.sol**: Wrapped Tura implementation
  - Address: 0x981Ad9e1565bb8325c9C9bBf80758529E7C50994
  - Features: ERC20 compliant, deposit/withdraw native Tura
  - Location: `contracts/backup/core/TuraWETH.sol`

- **TestToken.sol**: Test tokens (TT1, TT2) for development
  - TT1 Address: 0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9
  - TT2 Address: 0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122
  - Location: `contracts/backup/core/TestToken.sol`

- **PositionManager.sol**: Liquidity position management
  - Address: 0x7f94440f5CB70c496C054DB50c3f0f5414AD8216
  - Features: Position tracking, liquidity addition
  - Location: `contracts/PositionManager.sol`

#### Pool Contracts
- **TT1/TT2 Pool**: Main test pool
  - Address: 0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347
  - Fee Tier: 3000
  - Initial Price: 1:1
  - Current Liquidity: 100500000000000000000

#### V3 Contracts
Located in `contracts/`:
- **UniswapV3Factory.sol**: Pool factory implementation
- **UniswapV3Pool.sol**: Core pool logic
- **UniswapV3MintCallback.sol**: Liquidity addition callback
- **PositionManager.sol**: Position tracking and management
- Supporting libraries and interfaces

### Frontend Structure
Located in `frontend/`:

#### Key Components
1. **Pages** (`src/pages/`):
   - SwapPage: Main trading interface
   - LiquidityPage: Pool management

2. **Components** (`src/components/`):
   - WrapUnwrap: WTURA conversion interface
   - TokenSelect: Token selection modal
   - AddLiquidityModal: Pool creation interface

3. **Hooks** (`src/hooks/`):
   - useWeb3: Wallet connection and Web3 functionality
   - useTokenBalances: Token balance management
   - usePriceImpact: Price impact calculations

### Important Scripts

#### Deployment Scripts
Located in `scripts/`:
- `deploy-turaweth.ts`: Deploy WETH contract
- `deploy-test-token.ts`: Deploy test tokens
- `mint-tokens.ts`: Mint test tokens for testing

#### Testing Scripts
- `test-weth.ts`: Test WETH functionality
- `verify-weth.ts`: Verify contract deployment

### Configuration Files
1. **Frontend**:
   - `.env`: Environment configuration
   - `vite.config.ts`: Vite configuration
   - `hardhat.config.ts`: Hardhat network settings

2. **Contract Deployment**:
   - `Notes/deployment_records.md`: Deployment addresses and details

### Network Configuration
- RPC URL: https://rpc-beta1.turablockchain.com
- Chain ID: 1337
- Owner Address: 0x08Bb6eA809A2d6c13D57166Fa3ede48C0ae9a70e

## Development Workflow
1. Contract Development:
   - Implement in `contracts/backup/core/`
   - Test using Hardhat scripts
   - Deploy using deployment scripts
   - Update deployment records

2. Frontend Development:
   - Update environment variables
   - Implement UI components
   - Test with local development server
   - Build and deploy

## Testing
1. Contract Testing:
   - Use Hardhat for local testing
   - Verify on Tura testnet
   - Test basic functionality (e.g., wrap/unwrap for WETH)
   - Test liquidity addition with position tracking

2. Frontend Testing:
   - Local development with `npm run dev`
   - Connect MetaMask wallet
   - Test token interactions
   - Verify pool creation and liquidity addition
   - Test position management interface

## Recent Updates

### Uniswap V3 Research Findings

#### v3-core Package Analysis
1. Core Pool Implementation:
   - UniswapV3Pool.sol: Main pool contract with concentrated liquidity logic
   - Position tracking using unique position keys
   - Tick-based price range management
   - Secure callback system for minting and swapping

2. Factory Contract:
   - UniswapV3Factory.sol: Pool deployment and management
   - Fee tier configuration and validation
   - Pool initialization with sqrt price calculation

3. Key Libraries:
   - Position.sol: Position tracking and management
   - TickMath.sol: Price range calculations
   - LiquidityMath.sol: Liquidity amount calculations
   - TransferHelper.sol: Secure token transfers

#### v3-periphery Package Analysis
1. Position Management:
   - NonfungiblePositionManager: NFT-based position tracking
   - Simplified liquidity addition interface
   - Position range and fee management

2. Router Implementation:
   - SwapRouter: Multi-hop swap execution
   - Optimal path finding and slippage protection
   - Callback handling for token transfers

#### Interface Package Analysis
1. Frontend Architecture:
   - React-based component structure
   - Web3 integration for blockchain interaction
   - State management for pool and position data

2. Key Features:
   - Pool creation and management
   - Liquidity provision interface
   - Position tracking and management
   - Swap execution with price impact calculation

### Implementation Progress
1. Position Management:
   - Implemented PositionManager contract based on v3-periphery patterns
   - Added secure position tracking using unique keys
   - Enhanced token transfer security with TransferHelper
   - Successful liquidity addition testing

2. Pool Management:
   - TT1/TT2 pool deployed and initialized
   - Added initial liquidity with position tracking
   - Verified pool state and token balances
   - Implemented proper callback handling based on v3-core
