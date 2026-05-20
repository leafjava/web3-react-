/**
 * 自定义 Hook 复用逻辑示例
 * 
 * 类似 Vue 的 Composables，React 用自定义 Hook 提取公共逻辑
 * 
 * 核心原则：
 * 1. 以 use 开头命名
 * 2. 可以调用其他 Hook
 * 3. 返回状态和方法
 * 4. 逻辑复用，组件更简洁
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// ==================== 1. 钱包连接 Hook ====================

interface UseWalletOptions {
  autoConnect?: boolean
  onConnect?: (address: string) => void
  onDisconnect?: () => void
}

export function useWallet(options: UseWalletOptions = {}) {
  const [address, setAddress] = useState<string>()
  const [chainId, setChainId] = useState<number>()
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // 连接钱包
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      const err = new Error('请安装 MetaMask')
      setError(err)
      throw err
    }

    setIsConnecting(true)
    setError(null)

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId'
      })

      setAddress(accounts[0])
      setChainId(parseInt(chainIdHex, 16))
      
      options.onConnect?.(accounts[0])
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [options.onConnect])

  // 断开连接
  const disconnect = useCallback(() => {
    setAddress(undefined)
    setChainId(undefined)
    options.onDisconnect?.()
  }, [options.onDisconnect])

  // 自动连接
  useEffect(() => {
    if (options.autoConnect) {
      connect().catch(console.error)
    }
  }, [options.autoConnect, connect])

  // 监听账户变化
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        setAddress(accounts[0])
      }
    }

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16))
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum?.removeListener('chainChanged', handleChainChanged)
    }
  }, [disconnect])

  return {
    address,
    chainId,
    isConnected: !!address,
    isConnecting,
    error,
    connect,
    disconnect
  }
}

// ==================== 2. 合约读取 Hook ====================

interface UseContractReadOptions<T> {
  enabled?: boolean
  refetchInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useContractRead<T>(
  address: string,
  abi: any[],
  functionName: string,
  args: any[] = [],
  options: UseContractReadOptions<T> = {}
) {
  const [data, setData] = useState<T>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const fetchData = useCallback(async () => {
    if (options.enabled === false) return

    setIsLoading(true)
    setError(null)

    try {
      // 模拟合约调用
      const result = await mockContractCall<T>(address, functionName, args)
      setData(result)
      setLastFetchTime(Date.now())
      options.onSuccess?.(result)
    } catch (err) {
      const error = err as Error
      setError(error)
      options.onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [address, functionName, JSON.stringify(args), options.enabled])

  // 初始加载
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 定时刷新
  useEffect(() => {
    if (!options.refetchInterval) return

    const timer = setInterval(fetchData, options.refetchInterval)
    return () => clearInterval(timer)
  }, [fetchData, options.refetchInterval])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    lastFetchTime
  }
}

// ==================== 3. 交易处理 Hook ====================

type TransactionStatus = 'idle' | 'preparing' | 'pending' | 'success' | 'error'

interface UseTransactionOptions {
  onSuccess?: (txHash: string) => void
  onError?: (error: Error) => void
}

export function useTransaction(options: UseTransactionOptions = {}) {
  const [status, setStatus] = useState<TransactionStatus>('idle')
  const [txHash, setTxHash] = useState<string>()
  const [error, setError] = useState<Error | null>(null)

  const sendTransaction = useCallback(async (tx: any) => {
    setStatus('preparing')
    setError(null)

    try {
      if (!window.ethereum) {
        throw new Error('请安装 MetaMask')
      }

      setStatus('pending')

      // 模拟发送交易
      const hash = await mockSendTransaction(tx)
      setTxHash(hash)

      // 模拟等待确认
      await mockWaitForTransaction(hash)
      
      setStatus('success')
      options.onSuccess?.(hash)

      return hash
    } catch (err) {
      const error = err as Error
      setStatus('error')
      setError(error)
      options.onError?.(error)
      throw error
    }
  }, [options.onSuccess, options.onError])

  const reset = useCallback(() => {
    setStatus('idle')
    setTxHash(undefined)
    setError(null)
  }, [])

  return {
    sendTransaction,
    status,
    txHash,
    error,
    reset,
    isPreparing: status === 'preparing',
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error'
  }
}

// ==================== 4. Token 余额 Hook ====================

export function useTokenBalance(tokenAddress: string, userAddress?: string) {
  const { data: balance, isLoading, error, refetch } = useContractRead<bigint>(
    tokenAddress,
    ['function balanceOf(address) view returns (uint256)'],
    'balanceOf',
    [userAddress],
    {
      enabled: !!userAddress,
      refetchInterval: 10000 // 每 10 秒刷新
    }
  )

  // 格式化余额
  const formattedBalance = balance ? formatBalance(balance, 18) : '0'

  return {
    balance,
    formattedBalance,
    isLoading,
    error,
    refetch
  }
}

// ==================== 5. 本地存储 Hook ====================

export function useLocalStorage<T>(key: string, initialValue: T) {
  // 从 localStorage 读取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error('读取 localStorage 失败:', error)
      return initialValue
    }
  })

  // 更新 localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error('写入 localStorage 失败:', error)
    }
  }, [key, storedValue])

  return [storedValue, setValue] as const
}

// ==================== 6. 防抖 Hook ====================

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// ==================== 7. 轮询 Hook ====================

export function usePolling(callback: () => void, interval: number, enabled: boolean = true) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    const tick = () => savedCallback.current()
    const timer = setInterval(tick, interval)

    return () => clearInterval(timer)
  }, [interval, enabled])
}

// ==================== 8. 窗口大小 Hook ====================

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

// ==================== 9. 复制到剪贴板 Hook ====================

export function useClipboard() {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }, [])

  return { copied, copy }
}

// ==================== 10. 组合多个 Hook ====================

/**
 * 组合 Hook 示例：Token 交换
 */
export function useTokenSwap(tokenIn: string, tokenOut: string) {
  const { address } = useWallet()
  const { balance: balanceIn } = useTokenBalance(tokenIn, address)
  const { sendTransaction, status, txHash } = useTransaction({
    onSuccess: (hash) => {
      console.log('交换成功:', hash)
    }
  })

  const [amount, setAmount] = useState('')
  const debouncedAmount = useDebounce(amount, 500)

  // 获取兑换比例
  const { data: quote } = useContractRead<bigint>(
    '0xSwapRouter',
    ['function getQuote(address,address,uint256) view returns (uint256)'],
    'getQuote',
    [tokenIn, tokenOut, debouncedAmount],
    {
      enabled: !!debouncedAmount && parseFloat(debouncedAmount) > 0
    }
  )

  const swap = useCallback(async () => {
    if (!amount || !address) return

    await sendTransaction({
      to: '0xSwapRouter',
      data: encodeSwapData(tokenIn, tokenOut, amount)
    })
  }, [amount, address, tokenIn, tokenOut, sendTransaction])

  return {
    amount,
    setAmount,
    quote,
    balanceIn,
    swap,
    status,
    txHash,
    canSwap: !!amount && !!balanceIn && parseFloat(amount) <= Number(balanceIn)
  }
}

// ==================== 使用示例 ====================

/**
 * 钱包连接组件
 */
export function WalletConnect() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet({
    autoConnect: true,
    onConnect: (addr) => console.log('已连接:', addr),
    onDisconnect: () => console.log('已断开')
  })

  const { copy, copied } = useClipboard()

  if (!isConnected) {
    return (
      <button onClick={connect} disabled={isConnecting}>
        {isConnecting ? '连接中...' : '连接钱包'}
      </button>
    )
  }

  return (
    <div>
      <p>
        {address?.slice(0, 6)}...{address?.slice(-4)}
        <button onClick={() => copy(address!)}>
          {copied ? '已复制' : '复制'}
        </button>
      </p>
      <button onClick={disconnect}>断开</button>
    </div>
  )
}

/**
 * Token 余额组件
 */
export function TokenBalanceDisplay({ tokenAddress }: { tokenAddress: string }) {
  const { address } = useWallet()
  const { formattedBalance, isLoading, refetch } = useTokenBalance(tokenAddress, address)

  if (!address) return <div>请先连接钱包</div>
  if (isLoading) return <div>加载中...</div>

  return (
    <div>
      <p>余额: {formattedBalance}</p>
      <button onClick={refetch}>刷新</button>
    </div>
  )
}

/**
 * Token 交换组件
 */
export function TokenSwapForm() {
  const {
    amount,
    setAmount,
    quote,
    balanceIn,
    swap,
    status,
    canSwap
  } = useTokenSwap('0xTokenA', '0xTokenB')

  return (
    <div>
      <h3>Token 交换</h3>
      
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="输入金额"
      />
      
      <p>可用余额: {balanceIn?.toString()}</p>
      <p>预计获得: {quote?.toString()}</p>
      
      <button onClick={swap} disabled={!canSwap || status === 'pending'}>
        {status === 'pending' ? '交换中...' : '交换'}
      </button>
    </div>
  )
}

// ==================== 工具函数 ====================

function formatBalance(balance: bigint, decimals: number): string {
  return (Number(balance) / Math.pow(10, decimals)).toFixed(4)
}

function encodeSwapData(tokenIn: string, tokenOut: string, amount: string): string {
  // 模拟编码
  return '0x' + tokenIn + tokenOut + amount
}

async function mockContractCall<T>(address: string, functionName: string, args: any[]): Promise<T> {
  // 模拟合约调用
  await new Promise(resolve => setTimeout(resolve, 1000))
  return BigInt(1000000000000000000) as T
}

async function mockSendTransaction(tx: any): Promise<string> {
  // 模拟发送交易
  await new Promise(resolve => setTimeout(resolve, 1000))
  return '0x' + Math.random().toString(16).slice(2)
}

async function mockWaitForTransaction(hash: string): Promise<void> {
  // 模拟等待确认
  await new Promise(resolve => setTimeout(resolve, 2000))
}

/**
 * 自定义 Hook 的优势：
 * 
 * 1. 逻辑复用
 *    - 多个组件可以共享同一个 Hook
 *    - 避免重复代码
 * 
 * 2. 关注点分离
 *    - 组件只关注 UI
 *    - Hook 处理业务逻辑
 * 
 * 3. 易于测试
 *    - Hook 可以独立测试
 *    - 不需要渲染组件
 * 
 * 4. 组合能力强
 *    - Hook 可以调用其他 Hook
 *    - 构建复杂功能
 * 
 * 5. 类似 Vue Composables
 *    - 思路相同，语法不同
 *    - React 用 use 前缀
 *    - Vue 用 use 前缀或任意名称
 */

declare global {
  interface Window {
    ethereum?: any
  }
}

export {}
