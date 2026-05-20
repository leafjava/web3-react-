# 自定义 Hook 示例 - Web3 钱包管理

## 📚 目录结构

```
16/
├── 面试回答模板.md          # 面试问题回答模板
├── useWallet.js            # 钱包连接管理 Hook
├── useContractRead.js      # 智能合约读取 Hook
├── useTransaction.js       # 交易管理 Hook
├── App.jsx                 # 使用示例组件
├── App.css                 # 样式文件
└── README.md              # 本文档
```

## 🎯 学习目标

通过这三个自定义 Hook 的实现，掌握：

1. **useEffect 依赖数组原理**
   - Object.is() 浅比较机制
   - 依赖项变化触发时机
   - 清理函数的执行时机

2. **自定义 Hook 封装技巧**
   - 状态管理（useState/useReducer）
   - 副作用处理（useEffect）
   - 性能优化（useMemo/useCallback）
   - 引用管理（useRef）

3. **实战应用场景**
   - Web3 钱包集成
   - 智能合约交互
   - 异步状态管理
   - 错误处理和重试

## 🔧 Hook 详解

### 1. useWallet - 钱包连接管理

**核心功能：**
- ✅ 连接/断开 MetaMask 钱包
- ✅ 监听账户切换事件
- ✅ 监听网络切换事件
- ✅ 查询账户余额
- ✅ 自动检测连接状态

**技术要点：**

```javascript
// 1. useState 管理多个状态
const [account, setAccount] = useState(null);
const [balance, setBalance] = useState('0');
const [chainId, setChainId] = useState(null);

// 2. useCallback 优化回调函数
const connect = useCallback(async () => {
  // 连接逻辑
}, [fetchBalance]);

// 3. useEffect 监听事件（重点）
useEffect(() => {
  const handleAccountsChanged = (accounts) => {
    // 处理账户切换
  };
  
  window.ethereum.on('accountsChanged', handleAccountsChanged);
  
  // 清理函数：移除监听器
  return () => {
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
  };
}, [account, disconnect, fetchBalance]); // 依赖项
```

**依赖数组原理体现：**
- `account` 变化时，需要重新设置监听器
- `fetchBalance` 是 useCallback 缓存的函数，引用稳定
- 清理函数在依赖项变化前执行，防止内存泄漏

---

### 2. useContractRead - 智能合约读取

**核心功能：**
- ✅ 读取智能合约数据
- ✅ 自动轮询刷新
- ✅ 缓存管理（减少请求）
- ✅ 错误重试机制

**技术要点：**

```javascript
// 1. useMemo 缓存合约实例
const contract = useMemo(() => {
  return createContract(contractAddress, abi);
}, [contractAddress, abi]); // 只在地址或 ABI 变化时重新创建

// 2. useCallback 缓存数据获取函数
const fetchData = useCallback(async () => {
  // 检查缓存
  if (data && Date.now() - lastFetchTime < cacheTime) {
    return; // 使用缓存
  }
  // 获取新数据
}, [contract, functionName, args, data, lastFetchTime, cacheTime]);

// 3. useEffect 处理轮询（重点）
useEffect(() => {
  if (!enabled || pollingInterval <= 0) return;
  
  const timer = setInterval(() => {
    fetchData();
  }, pollingInterval);
  
  // 清理函数：清除定时器
  return () => {
    clearInterval(timer);
  };
}, [enabled, pollingInterval, fetchData]);
```

**依赖数组原理体现：**
- `pollingInterval` 变化时，清除旧定时器，创建新定时器
- `fetchData` 依赖多个状态，使用 useCallback 避免无限循环
- 清理函数确保组件卸载时不会继续轮询

---

### 3. useTransaction - 交易管理

**核心功能：**
- ✅ 发送区块链交易
- ✅ Gas 费估算
- ✅ 跟踪交易状态（pending/confirming/success/failed）
- ✅ 等待交易确认
- ✅ 取消机制

**技术要点：**

```javascript
// 1. useReducer 管理复杂状态
const [state, dispatch] = useReducer(transactionReducer, initialState);

// 状态转换清晰
dispatch({ type: 'PENDING' });
dispatch({ type: 'CONFIRMING', payload: txHash });
dispatch({ type: 'SUCCESS', payload: receipt });

// 2. useRef 保存取消标志（不触发重渲染）
const isCancelledRef = useRef(false);

// 在异步操作中检查
if (isCancelledRef.current) return;

// 3. useCallback 封装交易逻辑
const sendTransaction = useCallback(async (txParams) => {
  // 1. 估算 Gas
  // 2. 发送交易
  // 3. 等待确认
  // 4. 返回结果
}, [estimateGas]);
```

**依赖数组原理体现：**
- useReducer 不需要依赖数组（dispatch 引用稳定）
- useRef 的值变化不会触发重渲染
- useCallback 确保函数引用稳定

---

## 🎓 面试要点总结

### 1. useEffect 依赖数组原理

**对比机制：**
```javascript
// React 使用 Object.is() 进行浅比较
Object.is(oldValue, newValue)

// 基本类型：比较值
Object.is(1, 1) // true
Object.is('a', 'a') // true

// 引用类型：比较引用地址
Object.is({}, {}) // false（不同对象）
Object.is(obj, obj) // true（同一对象）
```

**三种使用场景：**
```javascript
// 1. 不传依赖数组 - 每次渲染都执行
useEffect(() => {
  console.log('每次渲染');
});

// 2. 空依赖数组 - 只在挂载时执行
useEffect(() => {
  console.log('只执行一次');
}, []);

// 3. 传入依赖项 - 依赖变化时执行
useEffect(() => {
  console.log('count 变化');
}, [count]);
```

**清理函数执行时机：**
1. 组件卸载时
2. 依赖项变化，下次 effect 执行前

---

### 2. 自定义 Hook 设计原则

**命名规范：**
- 必须以 `use` 开头
- 使用驼峰命名法
- 名称要清晰表达功能

**单一职责：**
- 每个 Hook 只负责一个功能领域
- useWallet 只管钱包，不管合约
- useContractRead 只读数据，不写数据

**返回值设计：**
```javascript
return {
  // 数据
  data,
  
  // 状态
  isLoading,
  isError,
  error,
  
  // 方法
  refetch,
  reset
};
```

**性能优化：**
- 使用 useMemo 缓存计算结果
- 使用 useCallback 缓存函数
- 合理设置依赖数组
- 避免不必要的重渲染

---

### 3. 常见陷阱与解决方案

**陷阱 1：遗漏依赖项**
```javascript
// ❌ 错误
useEffect(() => {
  console.log(count); // count 应该在依赖数组中
}, []);

// ✅ 正确
useEffect(() => {
  console.log(count);
}, [count]);
```

**陷阱 2：依赖项是对象/数组**
```javascript
// ❌ 错误：每次渲染都创建新对象
useEffect(() => {
  fetchData({ id: 1 });
}, [{ id: 1 }]); // 每次都是新对象

// ✅ 正确：使用 useMemo
const config = useMemo(() => ({ id: 1 }), []);
useEffect(() => {
  fetchData(config);
}, [config]);
```

**陷阱 3：闭包陷阱**
```javascript
// ❌ 错误：定时器中的 count 是旧值
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // 始终是初始值
  }, 1000);
  return () => clearInterval(timer);
}, []); // 空依赖数组

// ✅ 正确：使用 useRef 或添加依赖
const countRef = useRef(count);
countRef.current = count;

useEffect(() => {
  const timer = setInterval(() => {
    console.log(countRef.current); // 最新值
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

---

## 🚀 使用方法

### 1. 安装依赖

```bash
npm install
```

### 2. 运行示例

```bash
npm start
```

### 3. 在组件中使用

```javascript
import useWallet from './useWallet';
import useContractRead from './useContractRead';
import useTransaction from './useTransaction';

function MyComponent() {
  // 使用钱包 Hook
  const { account, connect, disconnect } = useWallet();
  
  // 使用合约读取 Hook
  const { data, isLoading } = useContractRead({
    contractAddress: '0x...',
    abi: [...],
    functionName: 'balanceOf',
    args: [account]
  });
  
  // 使用交易 Hook
  const { sendTransaction, isLoading: isSending } = useTransaction();
  
  return (
    // 你的 UI
  );
}
```

---

## 📖 扩展阅读

### Vue3 Composition API 对比

| React Hooks | Vue3 Composition API | 说明 |
|------------|---------------------|------|
| useState | ref / reactive | 响应式状态 |
| useEffect | watchEffect / watch | 副作用处理 |
| useMemo | computed | 计算属性 |
| useCallback | - | 函数缓存 |
| useRef | ref | DOM 引用 |
| 自定义 Hook | 组合式函数 | 逻辑复用 |

**核心思想一致：**
- 通过函数组合实现逻辑复用
- 按功能组织代码，而非生命周期
- 更好的 TypeScript 支持

---

## 💡 面试加分项

1. **深入理解原理**
   - 知道 useEffect 使用 Object.is() 比较
   - 理解闭包陷阱的原因
   - 了解 Fiber 架构中 Hook 的实现

2. **性能优化意识**
   - 合理使用 useMemo 和 useCallback
   - 避免不必要的重渲染
   - 理解依赖数组的性能影响

3. **实战经验**
   - 封装过多个自定义 Hook
   - 解决过复杂的状态管理问题
   - 有大型项目的 Hook 使用经验

4. **代码质量**
   - 遵循 Hook 规则
   - 使用 ESLint 插件检查
   - 编写单元测试

---

## 🔗 相关资源

- [React Hooks 官方文档](https://react.dev/reference/react)
- [useEffect 完整指南](https://overreacted.io/a-complete-guide-to-useeffect/)
- [自定义 Hook 最佳实践](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

## 📝 总结

这三个自定义 Hook 展示了：

1. **useWallet**：事件监听、状态管理、清理函数
2. **useContractRead**：缓存策略、轮询机制、性能优化
3. **useTransaction**：复杂状态管理、异步流程、错误处理

通过学习这些示例，你将掌握：
- useEffect 依赖数组的深层原理
- 自定义 Hook 的封装技巧
- 实际项目中的应用场景
- 面试中的回答要点

**记住：自定义 Hook 的本质是逻辑复用，关键在于合理的抽象和清晰的 API 设计。**
