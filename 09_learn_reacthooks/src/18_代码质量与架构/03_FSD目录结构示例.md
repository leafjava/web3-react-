# Feature-Sliced Design (FSD) 目录结构示例

## 什么是 FSD？

Feature-Sliced Design 是一种前端项目架构方法论，核心思想是**按功能纵向切分**，而不是按技术横向切分。

---

## 完整目录结构

```
web3-dapp/
├── src/
│   ├── app/                          # 应用层（最顶层）
│   │   ├── providers/                # 全局 Provider
│   │   │   ├── WalletProvider.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── index.tsx
│   │   ├── routes/                   # 路由配置
│   │   │   ├── index.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── styles/                   # 全局样式
│   │   │   ├── globals.css
│   │   │   └── variables.css
│   │   ├── App.tsx                   # 根组件
│   │   └── main.tsx                  # 入口文件
│   │
│   ├── pages/                        # 页面层
│   │   ├── home/
│   │   │   ├── ui/
│   │   │   │   └── HomePage.tsx
│   │   │   └── index.ts
│   │   ├── swap/
│   │   │   ├── ui/
│   │   │   │   └── SwapPage.tsx
│   │   │   └── index.ts
│   │   ├── stake/
│   │   │   ├── ui/
│   │   │   │   └── StakePage.tsx
│   │   │   └── index.ts
│   │   ├── liquidity/
│   │   │   ├── ui/
│   │   │   │   └── LiquidityPage.tsx
│   │   │   └── index.ts
│   │   └── portfolio/
│   │       ├── ui/
│   │       │   └── PortfolioPage.tsx
│   │       └── index.ts
│   │
│   ├── widgets/                      # 组合层（页面区块）
│   │   ├── wallet-connect/
│   │   │   ├── ui/
│   │   │   │   ├── WalletButton.tsx
│   │   │   │   └── WalletModal.tsx
│   │   │   ├── model/
│   │   │   │   └── useWalletConnect.ts
│   │   │   └── index.ts
│   │   ├── token-balance/
│   │   │   ├── ui/
│   │   │   │   └── TokenBalanceCard.tsx
│   │   │   ├── model/
│   │   │   │   └── useTokenBalance.ts
│   │   │   └── index.ts
│   │   ├── transaction-history/
│   │   │   ├── ui/
│   │   │   │   ├── TransactionList.tsx
│   │   │   │   └── TransactionItem.tsx
│   │   │   ├── model/
│   │   │   │   └── useTransactionHistory.ts
│   │   │   └── index.ts
│   │   └── price-chart/
│   │       ├── ui/
│   │       │   └── PriceChart.tsx
│   │       ├── model/
│   │       │   └── usePriceData.ts
│   │       └── index.ts
│   │
│   ├── features/                     # 功能层（业务功能）
│   │   ├── swap/
│   │   │   ├── ui/
│   │   │   │   ├── SwapForm.tsx
│   │   │   │   ├── TokenSelect.tsx
│   │   │   │   └── SwapButton.tsx
│   │   │   ├── model/
│   │   │   │   ├── useSwap.ts
│   │   │   │   ├── useSwapQuote.ts
│   │   │   │   └── swapSlice.ts
│   │   │   ├── api/
│   │   │   │   └── swapApi.ts
│   │   │   └── index.ts
│   │   ├── stake/
│   │   │   ├── ui/
│   │   │   │   ├── StakeForm.tsx
│   │   │   │   └── UnstakeForm.tsx
│   │   │   ├── model/
│   │   │   │   ├── useStake.ts
│   │   │   │   └── stakeSlice.ts
│   │   │   ├── api/
│   │   │   │   └── stakeApi.ts
│   │   │   └── index.ts
│   │   ├── liquidity/
│   │   │   ├── ui/
│   │   │   │   ├── AddLiquidityForm.tsx
│   │   │   │   └── RemoveLiquidityForm.tsx
│   │   │   ├── model/
│   │   │   │   └── useLiquidity.ts
│   │   │   ├── api/
│   │   │   │   └── liquidityApi.ts
│   │   │   └── index.ts
│   │   └── approve-token/
│   │       ├── ui/
│   │       │   └── ApproveButton.tsx
│   │       ├── model/
│   │       │   └── useApprove.ts
│   │       └── index.ts
│   │
│   ├── entities/                     # 实体层（业务实体）
│   │   ├── token/
│   │   │   ├── model/
│   │   │   │   ├── types.ts
│   │   │   │   └── tokenSlice.ts
│   │   │   ├── ui/
│   │   │   │   ├── TokenIcon.tsx
│   │   │   │   ├── TokenAmount.tsx
│   │   │   │   └── TokenPrice.tsx
│   │   │   ├── api/
│   │   │   │   └── tokenApi.ts
│   │   │   └── index.ts
│   │   ├── user/
│   │   │   ├── model/
│   │   │   │   ├── types.ts
│   │   │   │   └── userSlice.ts
│   │   │   ├── ui/
│   │   │   │   └── UserAvatar.tsx
│   │   │   ├── api/
│   │   │   │   └── userApi.ts
│   │   │   └── index.ts
│   │   ├── transaction/
│   │   │   ├── model/
│   │   │   │   ├── types.ts
│   │   │   │   └── transactionSlice.ts
│   │   │   ├── ui/
│   │   │   │   ├── TransactionStatus.tsx
│   │   │   │   └── TransactionLink.tsx
│   │   │   └── index.ts
│   │   └── pool/
│   │       ├── model/
│   │       │   ├── types.ts
│   │       │   └── poolSlice.ts
│   │       ├── ui/
│   │       │   └── PoolCard.tsx
│   │       └── index.ts
│   │
│   ├── shared/                       # 共享层（通用工具）
│   │   ├── ui/                       # 通用 UI 组件
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.module.css
│   │   │   │   └── index.ts
│   │   │   ├── Card/
│   │   │   │   ├── Card.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   │   ├── Input.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── index.ts
│   │   │   └── Spinner/
│   │   │       ├── Spinner.tsx
│   │   │       └── index.ts
│   │   ├── lib/                      # 工具函数
│   │   │   ├── format/
│   │   │   │   ├── formatAddress.ts
│   │   │   │   ├── formatBalance.ts
│   │   │   │   └── formatDate.ts
│   │   │   ├── validation/
│   │   │   │   ├── isAddress.ts
│   │   │   │   └── isValidAmount.ts
│   │   │   └── utils/
│   │   │       ├── sleep.ts
│   │   │       └── retry.ts
│   │   ├── hooks/                    # 通用 Hooks
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useClipboard.ts
│   │   │   └── useWindowSize.ts
│   │   ├── config/                   # 配置文件
│   │   │   ├── chains.ts
│   │   │   ├── tokens.ts
│   │   │   └── constants.ts
│   │   ├── types/                    # 通用类型
│   │   │   ├── common.ts
│   │   │   └── web3.ts
│   │   └── api/                      # API 基础配置
│   │       ├── client.ts
│   │       └── endpoints.ts
│   │
│   └── contracts/                    # 合约层（Web3 特有）
│       ├── abis/                     # 合约 ABI
│       │   ├── ERC20.json
│       │   ├── SwapRouter.json
│       │   └── StakingPool.json
│       ├── addresses/                # 合约地址
│       │   ├── mainnet.ts
│       │   ├── goerli.ts
│       │   └── index.ts
│       └── types/                    # 合约类型（typechain 生成）
│           ├── ERC20.ts
│           ├── SwapRouter.ts
│           └── StakingPool.ts
│
├── public/                           # 静态资源
│   ├── icons/
│   └── images/
│
├── .eslintrc.js                      # ESLint 配置
├── .prettierrc                       # Prettier 配置
├── tsconfig.json                     # TypeScript 配置
├── vite.config.ts                    # Vite 配置
└── package.json
```

---

## 层级说明

### 1. App 层（应用层）
**职责：** 应用初始化、全局配置、路由

```typescript
// app/providers/index.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <ThemeProvider>
        <QueryClientProvider>
          {children}
        </QueryClientProvider>
      </ThemeProvider>
    </WalletProvider>
  )
}
```

---

### 2. Pages 层（页面层）
**职责：** 页面路由、组合 widgets

```typescript
// pages/swap/ui/SwapPage.tsx
export function SwapPage() {
  return (
    <div>
      <WalletConnect />
      <SwapWidget />
      <TransactionHistory />
    </div>
  )
}
```

---

### 3. Widgets 层（组合层）
**职责：** 页面区块、组合 features 和 entities

```typescript
// widgets/wallet-connect/ui/WalletButton.tsx
export function WalletButton() {
  const { connect, disconnect, isConnected } = useWalletConnect()
  
  return (
    <Button onClick={isConnected ? disconnect : connect}>
      {isConnected ? '断开' : '连接钱包'}
    </Button>
  )
}
```

---

### 4. Features 层（功能层）
**职责：** 业务功能、用户交互

```typescript
// features/swap/ui/SwapForm.tsx
export function SwapForm() {
  const { swap, quote } = useSwap()
  
  return (
    <form onSubmit={swap}>
      <TokenSelect />
      <Input />
      <SwapButton />
    </form>
  )
}
```

---

### 5. Entities 层（实体层）
**职责：** 业务实体、数据模型

```typescript
// entities/token/model/types.ts
export interface Token {
  address: string
  symbol: string
  decimals: number
  balance: bigint
}

// entities/token/ui/TokenIcon.tsx
export function TokenIcon({ token }: { token: Token }) {
  return <img src={`/icons/${token.symbol}.png`} alt={token.symbol} />
}
```

---

### 6. Shared 层（共享层）
**职责：** 通用工具、UI 组件

```typescript
// shared/ui/Button/Button.tsx
export function Button({ children, ...props }: ButtonProps) {
  return <button className="btn" {...props}>{children}</button>
}

// shared/lib/format/formatAddress.ts
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
```

---

### 7. Contracts 层（合约层）
**职责：** 合约 ABI、地址、类型

```typescript
// contracts/addresses/index.ts
export const CONTRACTS = {
  1: { // Mainnet
    SWAP_ROUTER: '0x...',
    STAKING_POOL: '0x...'
  },
  5: { // Goerli
    SWAP_ROUTER: '0x...',
    STAKING_POOL: '0x...'
  }
}
```

---

## 依赖规则

```
app → pages → widgets → features → entities → shared
                                              ↓
                                          contracts
```

**核心原则：**
1. 上层可以依赖下层
2. 下层不能依赖上层
3. 同层不能相互依赖

**示例：**
```typescript
// ✅ 正确：features 依赖 entities
import { Token } from '@/entities/token'

// ✅ 正确：features 依赖 shared
import { Button } from '@/shared/ui'

// ❌ 错误：entities 依赖 features
import { useSwap } from '@/features/swap'

// ❌ 错误：同层相互依赖
import { useStake } from '@/features/stake' // 在 features/swap 中
```

---

## 优势

### 1. 功能内聚
- 一个功能的所有代码在一个目录
- 修改功能只需改一个地方
- 易于理解和维护

### 2. 易于协作
- 不同人负责不同功能
- 减少代码冲突
- 并行开发

### 3. 易于删除
- 删除功能直接删除目录
- 不影响其他功能
- 降低耦合

### 4. 易于测试
- 每层可以独立测试
- 依赖关系清晰
- Mock 更容易

### 5. 易于扩展
- 添加新功能只需添加新目录
- 不影响现有代码
- 结构清晰

---

## 对比传统 MVC

| 维度 | 传统 MVC | FSD |
|-----|---------|-----|
| **切分方式** | 横向（按技术） | 纵向（按功能） |
| **目录结构** | models/, views/, controllers/ | features/swap/, features/stake/ |
| **修改功能** | 需要改多个目录 | 只需改一个目录 |
| **删除功能** | 需要找到所有相关文件 | 直接删除目录 |
| **团队协作** | 容易冲突 | 不易冲突 |
| **适用场景** | 小型项目 | 大型项目 |

---

## 实际应用建议

### 小型项目（< 10 个页面）
```
src/
├── components/
├── hooks/
├── pages/
└── utils/
```

### 中型项目（10-50 个页面）
```
src/
├── features/
├── shared/
└── pages/
```

### 大型项目（50+ 个页面）
使用完整的 FSD 架构

---

## 总结

FSD 架构的核心思想：
1. **按功能纵向切分**，而不是按技术横向切分
2. **依赖单向**，上层依赖下层
3. **职责清晰**，每层有明确的职责
4. **易于维护**，功能内聚，易于删除

**记住：结构是为了更好地组织代码，不是为了结构而结构！**
