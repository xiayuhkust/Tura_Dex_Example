# Tura DEX 实现说明

## 核心组件

### 工厂合约 (Factory)
工厂合约负责管理池子的创建和费用配置：
- 使用确定性地址部署池子
- 费用等级管理 (0.05%, 0.3%, 1%)
- 每个费用等级的价格间隔配置

### 池子合约 (Pool)
池子合约实现核心DEX功能：
```solidity
contract UniswapV3Pool is IUniswapV3Pool, ReentrancyGuard {
    // 核心状态变量
    address public immutable factory;  // 工厂合约地址
    address public immutable token0;   // 代币0地址
    address public immutable token1;   // 代币1地址
    uint24 public immutable fee;       // 交易费率
    int24 public immutable tickSpacing; // 价格间隔
    
    // 价格和流动性追踪
    Slot0 private _slot0;              // 当前价格状态
    mapping(bytes32 => IPosition.Info) public positions; // 位置信息
    mapping(int24 => Tick.Info) public ticks;           // 价格点信息
    uint128 public liquidity;          // 当前流动性
}
```

### 主要功能
1. 集中流动性
   - 基于位置的流动性追踪
   - 基于价格区间的流动性管理
   - 动态费用增长追踪

2. 交换机制
   - 支持双向代币交换
   - 费用计算和收集
   - 价格影响保护
   - 滑点检查

3. 位置管理
   - 添加/移除流动性
   - 费用收集
   - 基于区间的位置管理

## 库合约
- TickMath: 价格转换计算
- SqrtPriceMath: 价格计算
- Position: 位置管理
- FullMath: 定点数计算

## 测试
完整的测试套件覆盖：
- 池子初始化
- 流动性提供
- 交换执行
- 费用收集
