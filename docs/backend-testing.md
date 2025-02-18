# Tura DEX Backend Testing Guide

## 环境配置
1. 区块链配置
```
TURA_CHAIN_ID=1337
TURA_RPC="https://rpc-beta1.turablockchain.com"
```

2. 合约地址
```
WETH9: 0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be
Test Token 1: 0xf7430841c1917Fee24B04dBbd0b809F36E5Ad716
Test Token 2: 0x3Cbc85319E3D9d6b29DDe06f591017e9f9666652
Factory: 0x7A7bbc265b2CaD0a22ddCE2Db5539394b9843888
```

## 测试步骤

### 1. 创建流动性池
```typescript
// 创建0.3%费率的池子
const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, signer);
await factory.createPool(token0Address, token1Address, 3000); // 3000 = 0.3%

// 获取池子地址
const poolAddress = await factory.getPool(token0Address, token1Address, 3000);
const pool = new ethers.Contract(poolAddress, poolABI, signer);

// 初始化池子价格
const initialPrice = '1000000000000000000'; // 1.0
await pool.initialize(initialPrice);
```

### 2. 添加流动性
```typescript
// 授权代币
await token0.approve(poolAddress, amount0);
await token1.approve(poolAddress, amount1);

// 添加流动性
const tickLower = -887272; // 最小tick
const tickUpper = 887272;  // 最大tick
await pool.mint(
    ownerAddress,
    tickLower,
    tickUpper,
    liquidityAmount
);

// 验证流动性
const position = await pool.getPosition(ownerAddress, tickLower, tickUpper);
console.log('Liquidity:', position.liquidity.toString());
```

### 3. 收取手续费
```typescript
// 执行交易后收取手续费
await pool.collect(
    ownerAddress,
    tickLower,
    tickUpper
);

// 验证手续费
const position = await pool.getPosition(ownerAddress, tickLower, tickUpper);
console.log('Fees Token0:', position.tokensOwed0.toString());
console.log('Fees Token1:', position.tokensOwed1.toString());
```

### 4. 价格计算
```typescript
// 获取当前价格
const slot0 = await pool.slot0();
const sqrtPriceX96 = slot0.sqrtPriceX96;
const price = (sqrtPriceX96 * sqrtPriceX96) / (2 ** 192);
console.log('Current Price:', price.toString());
```

### 5. 测试用例

#### 5.1 基本功能测试
1. 创建不同费率的池子 (0.3%, 0.5%, 1.0%)
2. 在不同价格范围添加流动性
3. 验证流动性位置信息
4. 执行交易并验证手续费

#### 5.2 边界测试
1. 使用最小和最大tick
2. 使用最小流动性数量
3. 测试价格范围边界

#### 5.3 错误处理
1. 尝试创建已存在的池子
2. 使用无效的费率
3. 添加超出范围的流动性
4. 未经授权的操作

## API测试

### 1. 价格查询
```bash
curl http://localhost:3000/api/price?tokenA=0x...&tokenB=0x...&fee=3000
```

### 2. 池子事件查询
```bash
curl http://localhost:3000/api/pools?fromBlock=0&toBlock=latest
```

## 注意事项
1. 确保使用正确的代币顺序（地址较小的为token0）
2. 流动性添加前需要先approve代币
3. 价格计算需要考虑decimals
4. 测试前确保账户有足够的测试代币

## 常见问题
1. "TF: POOL_EXISTS" - 池子已存在
2. "TF: FEE_NOT_ENABLED" - 费率未启用
3. "AI" - 池子已初始化
4. "TLU" - tick范围无效
