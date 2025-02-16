# Lesson 3: Peripheral Smart Contracts

## Overview
本课程介绍Uniswap V3外围合约的设计和实现，这些合约为核心功能提供了更友好的接口和额外的功能支持。

### 1. SwapRouter合约
- 路由设计
  * 单跳交易实现
  * 多跳交易路径
  * 最优路径计算
- 交易执行
  * exactInput实现
  * exactOutput实现
  * 回调处理

### 2. NFT Position管理
- Position NFT设计
  * ERC721标准实现
  * Position数据结构
  * Metadata处理
- 流动性管理
  * 添加流动性
  * 移除流动性
  * 收取手续费

### 3. 接口设计
- ISwapRouter
- INonfungiblePositionManager
- 回调接口实现
  * 交易回调
  * 流动性回调

### 4. 与核心合约的交互
- Factory交互
- Pool交互
- 安全考虑

## 实践练习
1. Router合约分析
2. Position NFT实现
3. 接口调用测试

## 下节预告
下一课将深入探讨Factory合约的具体实现。
