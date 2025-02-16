# Lesson 2: Core Smart Contract Design

## Overview
本课程深入讲解Uniswap V3核心合约的设计原理和实现细节。

## 主要内容

### 1. Factory合约设计
- 合约结构
  * 状态变量
  * 核心函数
  * 事件定义
- 池子创建机制
  * createPool函数实现
  * 费率配置
  * 安全检查

### 2. Pool合约设计
- 数据结构
  * Position信息
  * Tick管理
  * Oracle数据
- 核心功能实现
  * swap操作
  * 流动性管理
  * 价格计算

### 3. 接口设计
- IUniswapV3Factory
- IUniswapV3Pool
- 回调接口
  * Mint回调
  * Swap回调
  * Flash回调

### 4. 安全考虑
- 重入攻击防护
- 整数溢出保护
- 访问控制
- 闪电贷安全

## 实践练习
1. Factory合约分析
2. Pool合约功能实现
3. 接口调用测试

## 参考资料
- 源码分析
- 技术文档
- 安全审计报告

## 下节预告
下一课将介绍外围合约的设计和实现。
