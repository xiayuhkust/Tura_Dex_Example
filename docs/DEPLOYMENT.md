# Deployment Documentation

## Contract Addresses
- Token0: 0xB345Db6f7551be988894F30D76057295aaA89f53
- Token1: 0x6BA591459B1Cea054bC5c174197Db6164a6100d9
- Factory: 0xa4886244EE985BF17f498a91d928D95FC73e3489
- Pool: 0x4Ea9F8e2A47C0Cd221290457C33d0ef211089312
- TestCallee: 0x767f83D70FdE81FC17CCfaC2AD6e5BE4214143e4

## Initial Pool Parameters
- Fee tier: MEDIUM (3000)
- Initial price: 1:1 (sqrtPriceX96: 1000000000000000000000000)
- Initial tick: -225614
- Test tokens: 1M tokens each with 18 decimals

## Transaction Hashes
1. Pool Creation & Initialization:
   - Pool creation: [View on Explorer](http://43.135.127.231:3000/tx/0xfc2d5caa459c13795dae06ddf422c2ad54e7fb3a83776144baf49d1fe13e11d5)

2. Test Swap:
   - Swap transaction: [View on Explorer](http://43.135.127.231:3000/tx/0x2f0526486c57ea90166c1bb47271f603a6124a9c550caf7d817fa593c3df2434)
   - Result: Successfully swapped token0 for token1
   - Price after swap: 4295128740
   - Tick after swap: -887272

## Deployment Verification
All contracts have been verified and are functioning as expected:
- Factory successfully creates pools
- Pool initialization works correctly
- Swap functionality confirmed working
- Token transfers and approvals working properly

## Network Information
- Network: Tura Blockchain
- RPC URL: https://rpc-beta1.turablockchain.com
- Chain ID: 1337
- Block Explorer: http://43.135.127.231:3000/
