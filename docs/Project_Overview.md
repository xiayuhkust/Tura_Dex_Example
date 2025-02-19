# AgentSwap Project Overview

## Project Structure

### Smart Contracts
Located in `contracts/backup`:

#### Core Contracts
- **TuraWETH.sol**: Wrapped Tura implementation
  - Address: 0x981Ad9e1565bb8325c9C9bBf80758529E7C50994
  - Features: ERC20 compliant, deposit/withdraw native Tura
  - Location: `contracts/backup/core/TuraWETH.sol`

- **TestToken.sol**: Test tokens (TT1, TT2) for development
  - TT1 Address: 0x51317d5134B62C44558013d6d915F3807682Ab16
  - TT2 Address: 0xa79aEb156a8a267f73C844df1877D32CBa2053f3
  - Location: `contracts/backup/core/TestToken.sol`

#### V3 Contracts
Located in `contracts/backup/v3`:
- Factory and Pool contracts
- Interfaces and libraries
- Test contracts

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

2. Frontend Testing:
   - Local development with `npm run dev`
   - Connect MetaMask wallet
   - Test token interactions
   - Verify pool creation and swaps
