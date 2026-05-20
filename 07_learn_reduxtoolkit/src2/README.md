# RTK Query 详解与实战示例

## 📚 目录结构

```
src2/
├── README.md                    # 本文件
├── api/
│   ├── walletApi.js            # 钱包相关 API
│   └── tokenApi.js             # 代币相关 API
├── store/
│   └── index.js                # Store 配置
├── components/
│   ├── WalletBalance.jsx       # 余额展示组件
│   ├── SendTransaction.jsx     # 发送交易组件
│   └── TokenList.jsx           # 代币列表组件
├── hooks/
│   └── useWalletWithRTK.js     # 自定义 Hook
└── examples/
    ├── 01-basic-query.js       # 基础查询示例
    ├── 02-mutation.js          # Mutation 示例
    ├── 03-cache-invalidation.js # 缓存失效示例
    └── 04-optimistic-update.js # 乐观更新示例
```

## 🎯 RTK Query 核心概念

### 1. 什么是 RTK Query？

RTK Query 是 Redux Toolkit 的一部分，专门用于数据获取和缓存的强大工具。可以把它理解为"Redux 版本的 React Query"。

**核心特性：**
- ✅ 自动化的数据获取层：不需要手写 action、reducer、thunk
- ✅ 内置缓存管理：自动缓存、去重、失效处理
- ✅ 类型安全：完整的 TypeScript 支持
- ✅ 自动生成 Hooks：useXxxQuery、useXxxMutation

### 2. 与传统方式对比

**传统 Redux 方式（需要大量模板代码）：**
- 定义 action types
- 创建 action creators
- 编写 reducer 处理 pending/fulfilled/rejected
- 手动管理 loading、error 状态

**RTK Query 方式（只需定义 API 端点）：**
- 一次性定义所有端点
- 自动生成 Hooks
- 自动管理缓存和状态

## 🚀 快速开始

### 安装依赖

```bash
npm install @reduxjs/toolkit react-redux
```

### 基础使用流程

1. 创建 API Slice
2. 配置 Store
3. 在组件中使用生成的 Hooks

## 📖 学习路径

1. 先看 `examples/01-basic-query.js` 了解基础查询
2. 再看 `examples/02-mutation.js` 学习数据修改
3. 然后看 `examples/03-cache-invalidation.js` 理解缓存管理
4. 最后看 `examples/04-optimistic-update.js` 掌握高级技巧

## 🌐 Web3 实战场景

本示例专门针对 Web3 项目设计，包含：
- 多链钱包余额查询
- 交易历史记录
- 发送交易（Mutation）
- 代币价格实时更新
- 与 Wagmi 结合使用

## 📝 面试回答模板

**问：如何在大型 Web3 项目中管理钱包状态？**

"我会用 Redux Toolkit + RTK Query 的组合方案：

1. **钱包连接状态**：用 Wagmi + Context 管理（address、chainId、连接状态）
2. **服务端数据**：用 RTK Query 管理（余额、交易历史、NFT 列表）
3. **本地 UI 状态**：用 Zustand 或 Redux Toolkit 的 slice

RTK Query 的优势是：
- 自动缓存和去重，多个组件调用同一接口只请求一次
- 内置 loading/error 状态，不需要手写
- 支持轮询和自动刷新，适合实时更新余额
- Mutation 后自动失效缓存，保证数据一致性

比如发送交易后，通过 invalidatesTags 自动刷新余额和交易列表，不需要手动调用 refetch。"
