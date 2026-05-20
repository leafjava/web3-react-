# 代码质量与架构完整教程

> 大型 Web3 项目如何保证代码可维护性

---

## 📚 目录结构

```
18_代码质量与架构/
├── 01_TypeScript类型安全示例.tsx        # ⭐ TypeScript 实践
├── 02_自定义Hook复用逻辑.tsx            # ⭐ Hook 复用
├── 03_FSD目录结构示例.md                # ⭐ 架构设计
├── 04_代码质量工具链配置/                # ⭐ 工具链
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── tsconfig.json
│   └── package.json
├── 面试标准答案.md                       # 📝 面试必看
└── README.md                            # 📘 本文件
```

---

## 🎯 核心内容

### 五大支柱保证代码可维护性

```
代码可维护性
├── 1. TypeScript 类型安全
│   ├── 编译时发现错误
│   ├── IDE 智能提示
│   └── 重构更安全
│
├── 2. 自定义 Hook 复用逻辑
│   ├── 逻辑复用
│   ├── 关注点分离
│   └── 易于测试
│
├── 3. 组件库统一 UI
│   ├── shadcn/ui（推荐）
│   ├── Ant Design
│   └── 自定义组件库
│
├── 4. 目录结构规范
│   ├── FSD 架构
│   ├── 按功能分层
│   └── 依赖单向
│
└── 5. 代码质量工具链
    ├── ESLint（代码检查）
    ├── Prettier（格式化）
    ├── TypeScript（类型检查）
    ├── Vitest（测试）
    └── Husky（Git 钩子）
```

---

## 🚀 快速开始

### 1. TypeScript 类型安全

**查看文件：** `01_TypeScript类型安全示例.tsx`

**核心实践：**

```typescript
// 定义类型
interface Token {
  address: `0x${string}`
  symbol: string
  decimals: number
  balance: bigint
}

// 使用泛型
function useContractRead<T>(
  address: string,
  abi: any[],
  functionName: string
): {
  data: T | undefined
  isLoading: boolean
  error: Error | null
} {
  // 实现...
}

// 使用
const { data } = useContractRead<bigint>(
  TOKEN_ADDRESS,
  ERC20_ABI,
  'balanceOf'
)
```

**优势：**
- ✅ 编译时发现错误
- ✅ IDE 智能提示
- ✅ 重构更安全

---

### 2. 自定义 Hook 复用逻辑

**查看文件：** `02_自定义Hook复用逻辑.tsx`

**核心实践：**

```typescript
// 钱包连接 Hook
function useWallet() {
  const [address, setAddress] = useState<string>()
  const [chainId, setChainId] = useState<number>()
  
  const connect = async () => {
    // 连接逻辑
  }
  
  return { address, chainId, connect, isConnected: !!address }
}

// 使用
function WalletButton() {
  const { address, connect, isConnected } = useWallet()
  
  return (
    <button onClick={connect}>
      {isConnected ? address : '连接钱包'}
    </button>
  )
}
```

**优势：**
- ✅ 逻辑复用，避免重复代码
- ✅ 关注点分离，组件更简洁
- ✅ 易于测试和维护

---

### 3. 组件库统一 UI

**推荐方案：**

#### shadcn/ui（推荐用于 Web3 DApp）

```bash
# 安装
npx shadcn-ui@latest init

# 添加组件
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
```

```typescript
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function WalletCard() {
  return (
    <Card>
      <h3>我的钱包</h3>
      <Button>连接钱包</Button>
    </Card>
  )
}
```

**优势：**
- 无样式组件，完全可定制
- 代码直接复制到项目
- 基于 Radix UI，可访问性好

#### Ant Design（推荐用于管理后台）

```bash
npm install antd
```

```typescript
import { Button, Card } from 'antd'

function Dashboard() {
  return (
    <Card title="数据统计">
      <Button type="primary">刷新</Button>
    </Card>
  )
}
```

---

### 4. 目录结构规范（FSD）

**查看文件：** `03_FSD目录结构示例.md`

**核心结构：**

```
src/
├── app/          # 应用层（路由、全局状态）
├── pages/        # 页面层
├── widgets/      # 组合层（页面区块）
├── features/     # 功能层（业务逻辑）
├── entities/     # 实体层（业务实体）
├── shared/       # 共享层（通用工具）
└── contracts/    # 合约层（Web3 特有）
```

**依赖规则：**

```
app → pages → widgets → features → entities → shared
```

**优势：**
- ✅ 功能内聚，修改一个功能只需改一个目录
- ✅ 易于团队协作，不同人负责不同功能
- ✅ 易于删除功能，直接删除目录即可

---

### 5. 代码质量工具链

**查看目录：** `04_代码质量工具链配置/`

**完整工具链：**

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "prepare": "husky install"
  }
}
```

**工具说明：**

| 工具 | 作用 | 配置文件 |
|-----|------|---------|
| ESLint | 代码检查 | `.eslintrc.js` |
| Prettier | 代码格式化 | `.prettierrc` |
| TypeScript | 类型检查 | `tsconfig.json` |
| Vitest | 单元测试 | `vitest.config.ts` |
| Husky | Git 钩子 | `.husky/pre-commit` |

---

## 💡 实战案例

### 案例 1：Token 余额组件

**需求：** 显示用户的 Token 余额，支持刷新

**实现：**

```typescript
// 1. 定义类型
interface Token {
  address: string
  symbol: string
  decimals: number
}

// 2. 自定义 Hook
function useTokenBalance(token: Token, userAddress?: string) {
  const { data: balance, isLoading, refetch } = useContractRead<bigint>(
    token.address,
    ['function balanceOf(address) view returns (uint256)'],
    'balanceOf',
    [userAddress]
  )
  
  const formattedBalance = balance 
    ? (Number(balance) / Math.pow(10, token.decimals)).toFixed(4)
    : '0'
  
  return { balance, formattedBalance, isLoading, refetch }
}

// 3. 组件
function TokenBalance({ token }: { token: Token }) {
  const { address } = useWallet()
  const { formattedBalance, isLoading, refetch } = useTokenBalance(token, address)
  
  if (!address) return <div>请先连接钱包</div>
  if (isLoading) return <div>加载中...</div>
  
  return (
    <Card>
      <h3>{token.symbol} 余额</h3>
      <p>{formattedBalance}</p>
      <Button onClick={refetch}>刷新</Button>
    </Card>
  )
}
```

**优势：**
- ✅ 类型安全（TypeScript）
- ✅ 逻辑复用（useTokenBalance）
- ✅ UI 统一（Card, Button）
- ✅ 结构清晰（entities/token）

---

### 案例 2：Token 交换功能

**需求：** 实现 Token 交换，包括报价、授权、交换

**目录结构：**

```
features/swap/
├── ui/
│   ├── SwapForm.tsx
│   ├── TokenSelect.tsx
│   └── SwapButton.tsx
├── model/
│   ├── useSwap.ts
│   ├── useSwapQuote.ts
│   └── useApprove.ts
├── api/
│   └── swapApi.ts
└── index.ts
```

**实现：**

```typescript
// features/swap/model/useSwap.ts
export function useSwap() {
  const { address } = useWallet()
  const { sendTransaction } = useTransaction()
  
  const swap = async (tokenIn: Token, tokenOut: Token, amount: string) => {
    // 1. 检查授权
    const allowance = await checkAllowance(tokenIn.address, address)
    if (allowance < parseAmount(amount)) {
      await approve(tokenIn.address)
    }
    
    // 2. 执行交换
    const tx = await buildSwapTx(tokenIn, tokenOut, amount)
    await sendTransaction(tx)
  }
  
  return { swap }
}

// features/swap/ui/SwapForm.tsx
export function SwapForm() {
  const { swap } = useSwap()
  const [tokenIn, setTokenIn] = useState<Token>()
  const [tokenOut, setTokenOut] = useState<Token>()
  const [amount, setAmount] = useState('')
  
  return (
    <Card>
      <TokenSelect value={tokenIn} onChange={setTokenIn} />
      <Input value={amount} onChange={setAmount} />
      <TokenSelect value={tokenOut} onChange={setTokenOut} />
      <SwapButton onClick={() => swap(tokenIn!, tokenOut!, amount)} />
    </Card>
  )
}
```

---

## 📊 Vue vs React 对比

| 维度 | Vue | React |
|-----|-----|-------|
| **逻辑复用** | Composables | 自定义 Hook |
| **类型支持** | Vue 3 + TypeScript | React + TypeScript |
| **组件库** | Element Plus, Ant Design Vue | shadcn/ui, Ant Design |
| **目录结构** | 自定义 | FSD 架构 |
| **工具链** | Vue CLI, Vite | Create React App, Vite |

**核心区别：**
- Vue 更偏向约定优于配置
- React 更偏向灵活自由
- 思路相同，语法不同

---

## 🔥 常见问题

### Q1: 为什么选择 TypeScript？

**A:** 在 Web3 项目中，合约交互涉及复杂的数据结构（bigint、地址、ABI），TypeScript 可以：
- 编译时发现错误，避免运行时崩溃
- IDE 智能提示，提升开发效率
- 重构更安全，不怕改漏

---

### Q2: 自定义 Hook 和 Vue Composables 有什么区别？

**A:** 思路相同，语法不同

**Vue Composables:**
```typescript
// useWallet.ts
export function useWallet() {
  const address = ref<string>()
  
  const connect = async () => {
    // 连接逻辑
  }
  
  return { address, connect }
}
```

**React Hook:**
```typescript
// useWallet.ts
export function useWallet() {
  const [address, setAddress] = useState<string>()
  
  const connect = async () => {
    // 连接逻辑
  }
  
  return { address, connect }
}
```

**核心区别：**
- Vue 用 `ref`、`reactive`
- React 用 `useState`、`useReducer`
- Vue 自动追踪依赖
- React 需要手动指定依赖

---

### Q3: FSD 架构适合所有项目吗？

**A:** 不一定，根据项目规模选择

**小型项目（< 10 个页面）：**
```
src/
├── components/
├── hooks/
├── pages/
└── utils/
```

**中型项目（10-50 个页面）：**
```
src/
├── features/
├── shared/
└── pages/
```

**大型项目（50+ 个页面）：**
使用完整的 FSD 架构

---

### Q4: 如何测试自定义 Hook？

**A:** 使用 `@testing-library/react-hooks`

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useWallet } from './useWallet'

test('should connect wallet', async () => {
  const { result } = renderHook(() => useWallet())
  
  expect(result.current.isConnected).toBe(false)
  
  await result.current.connect()
  
  await waitFor(() => {
    expect(result.current.isConnected).toBe(true)
  })
})
```

---

## 📚 学习路径

### 第 1 天：TypeScript 基础
1. 学习 TypeScript 基础语法
2. 理解类型定义和泛型
3. 完成 `01_TypeScript类型安全示例.tsx`

### 第 2 天：自定义 Hook
1. 学习 Hook 规则
2. 理解逻辑复用
3. 完成 `02_自定义Hook复用逻辑.tsx`

### 第 3 天：组件库
1. 学习 shadcn/ui 或 Ant Design
2. 封装业务组件
3. 统一 UI 风格

### 第 4 天：目录结构
1. 学习 FSD 架构
2. 理解依赖规则
3. 阅读 `03_FSD目录结构示例.md`

### 第 5 天：工具链
1. 配置 ESLint、Prettier
2. 配置 TypeScript
3. 配置 Husky

### 第 6 天：面试准备
1. 阅读 `面试标准答案.md`
2. 整理自己的回答
3. 练习口头表达

---

## 🎓 最佳实践

### 1. 类型定义统一管理

```typescript
// shared/types/web3.ts
export type Address = `0x${string}`
export type ChainId = 1 | 5 | 137 | 80001

export interface Token {
  address: Address
  symbol: string
  decimals: number
}
```

---

### 2. Hook 命名规范

```typescript
// ✅ 正确
useWallet()
useTokenBalance()
useTransaction()

// ❌ 错误
getWallet()
tokenBalance()
transaction()
```

---

### 3. 组件拆分原则

```typescript
// ✅ 正确：职责单一
<TokenBalance token={token} />
<TokenPrice token={token} />
<TokenIcon token={token} />

// ❌ 错误：职责混乱
<TokenCard token={token} showBalance showPrice showIcon />
```

---

### 4. 错误处理

```typescript
// ✅ 正确：统一错误处理
try {
  await sendTransaction(tx)
} catch (error) {
  if (error.code === 4001) {
    toast.error('用户拒绝交易')
  } else {
    toast.error('交易失败')
  }
}
```

---

## 🔗 相关资源

### 本项目资源
- **自定义 Hook：** `09_learn_reacthooks/src/12_自定义Hooks/`
- **Web3 Hook：** `09_learn_reacthooks/src/16_web3的hook/`
- **代码质量：** `09_learn_reacthooks/src/18_代码质量与架构/`

### 官方文档
- [TypeScript](https://www.typescriptlang.org/)
- [React Hooks](https://react.dev/reference/react)
- [shadcn/ui](https://ui.shadcn.com/)
- [FSD](https://feature-sliced.design/)

---

## 📝 总结

### 核心要点

1. **TypeScript**：类型安全，编译时发现错误
2. **自定义 Hook**：逻辑复用，类似 Vue Composables
3. **组件库**：UI 统一，推荐 shadcn/ui
4. **FSD 架构**：按功能分层，职责清晰
5. **工具链**：自动化检查，保证质量

### 记住

- 可维护性 = 类型安全 + 逻辑复用 + 结构清晰 + 自动化检查
- 小项目简单结构，大项目 FSD 架构
- 工具是为了提升效率，不是为了工具而工具

---

**祝你学习愉快，面试顺利！** 🎉
