/**
 * TypeScript 类型安全示例
 * 
 * 在 Web3 项目中，TypeScript 可以：
 * 1. 定义合约交互的类型
 * 2. 定义 Hook 返回值类型
 * 3. 使用泛型增强复用性
 * 4. 编译时发现错误
 */

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

// ==================== 基础类型定义 ====================

/**
 * 以太坊地址类型（确保是 0x 开头的 42 位字符串）
 */
type Address = `0x${string}`

/**
 * Token 信息类型
 */
interface Token {
  address: Address
  symbol: string
  name: string
  decimals: number
  balance: bigint
  price?: number // USD 价格
}

/**
 * 链信息类型
 */
interface Chain {
  id: number
  name: string
  rpcUrl: string
  blockExplorer: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

/**
 * 交易请求类型
 */
interface TransactionRequest {
  to: Address
  value?: bigint
  data?: string
  gasLimit?: bigint
  gasPrice?: bigint
}

/**
 * 交易状态类型
 */
type TransactionStatus = 'idle' | 'pending' | 'success' | 'error'

// ==================== Hook 返回类型定义 ====================

/**
 * 钱包 Hook 返回类型
 */
interface UseWalletReturn {
  address: Address | undefined
  chainId: number | undefined
  balance: bigint | undefined
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  switchChain: (chainId: number) => Promise<void>
}

/**
 * 合约读取 Hook 返回类型（使用泛型）
 */
interface UseContractReadReturn<T> {
  data: T | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * 交易 Hook 返回类型
 */
interface UseTransactionReturn {
  sendTransaction: (tx: TransactionRequest) => Promise<string>
  status: TransactionStatus
  txHash: string | undefined
  error: Error | null
  reset: () => void
}

// ==================== 自定义 Hook 实现 ====================

/**
 * 钱包连接 Hook
 */
export function useWallet(): UseWalletReturn {
  const [address, setAddress] = useState<Address>()
  const [chainId, setChainId] = useState<number>()
  const [balance, setBalance] = useState<bigint>()
  const [isConnecting, setIsConnecting] = useState(false)

  const connect = async () => {
    if (!window.ethereum) {
      throw new Error('请安装 MetaMask 钱包')
    }

    setIsConnecting(true)
    try {
      // 请求账户授权
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[]
      
      setAddress(accounts[0] as Address)

      // 获取链 ID
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId'
      }) as string
      
      setChainId(parseInt(chainIdHex, 16))

      // 获取余额
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      }) as string
      
      setBalance(BigInt(balanceHex))
    } catch (error) {
      console.error('连接钱包失败:', error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAddress(undefined)
    setChainId(undefined)
    setBalance(undefined)
  }

  const switchChain = async (targetChainId: number) => {
    if (!window.ethereum) {
      throw new Error('请安装 MetaMask 钱包')
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      })
      setChainId(targetChainId)
    } catch (error: any) {
      // 如果链不存在，尝试添加
      if (error.code === 4902) {
        throw new Error('该链尚未添加到钱包')
      }
      throw error
    }
  }

  // 监听账户和链变化
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        setAddress(accounts[0] as Address)
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
  }, [])

  return {
    address,
    chainId,
    balance,
    isConnected: !!address,
    isConnecting,
    connect,
    disconnect,
    switchChain
  }
}

/**
 * 合约读取 Hook（泛型版本）
 */
export function useContractRead<T>(
  address: Address,
  abi: any[],
  functionName: string,
  args: any[] = []
): UseContractReadReturn<T> {
  const [data, setData] = useState<T>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY')
      const contract = new ethers.Contract(address, abi, provider)
      
      const result = await contract[functionName](...args)
      setData(result as T)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [address, functionName, JSON.stringify(args)])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  }
}

/**
 * 交易处理 Hook
 */
export function useTransaction(): UseTransactionReturn {
  const [status, setStatus] = useState<TransactionStatus>('idle')
  const [txHash, setTxHash] = useState<string>()
  const [error, setError] = useState<Error | null>(null)

  const sendTransaction = async (tx: TransactionRequest): Promise<string> => {
    setStatus('pending')
    setError(null)

    try {
      if (!window.ethereum) {
        throw new Error('请安装 MetaMask 钱包')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // 发送交易
      const response = await signer.sendTransaction({
        to: tx.to,
        value: tx.value,
        data: tx.data,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice
      })

      setTxHash(response.hash)

      // 等待交易确认
      await response.wait()
      setStatus('success')

      return response.hash
    } catch (err) {
      setStatus('error')
      setError(err as Error)
      throw err
    }
  }

  const reset = () => {
    setStatus('idle')
    setTxHash(undefined)
    setError(null)
  }

  return {
    sendTransaction,
    status,
    txHash,
    error,
    reset
  }
}

// ==================== 使用示例 ====================

/**
 * Token 余额组件
 */
export function TokenBalance() {
  const { address } = useWallet()
  
  // 使用泛型指定返回类型
  const { data: balance, isLoading, error } = useContractRead<bigint>(
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address, // USDC
    [
      'function balanceOf(address) view returns (uint256)'
    ],
    'balanceOf',
    [address]
  )

  if (!address) return <div>请先连接钱包</div>
  if (isLoading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>

  // TypeScript 知道 balance 是 bigint 类型
  const formattedBalance = balance ? ethers.formatUnits(balance, 6) : '0'

  return (
    <div>
      <h3>USDC 余额</h3>
      <p>{formattedBalance} USDC</p>
    </div>
  )
}

/**
 * 转账组件
 */
export function TransferForm() {
  const { address } = useWallet()
  const { sendTransaction, status, txHash, error } = useTransaction()

  const [recipient, setRecipient] = useState<string>('')
  const [amount, setAmount] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address) {
      alert('请先连接钱包')
      return
    }

    try {
      // TypeScript 会检查类型
      const tx: TransactionRequest = {
        to: recipient as Address,
        value: ethers.parseEther(amount)
      }

      await sendTransaction(tx)
      alert('转账成功！')
    } catch (err) {
      console.error('转账失败:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>转账 ETH</h3>
      
      <input
        type="text"
        placeholder="接收地址"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      
      <input
        type="number"
        placeholder="金额"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        step="0.01"
      />
      
      <button type="submit" disabled={status === 'pending'}>
        {status === 'pending' ? '发送中...' : '发送'}
      </button>

      {status === 'success' && txHash && (
        <div>
          交易成功！
          <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
            查看交易
          </a>
        </div>
      )}

      {error && <div style={{ color: 'red' }}>错误: {error.message}</div>}
    </form>
  )
}

/**
 * 主应用组件
 */
export function App() {
  const { address, chainId, balance, isConnected, connect, disconnect } = useWallet()

  return (
    <div>
      <h1>Web3 DApp</h1>

      {/* 钱包连接按钮 */}
      {!isConnected ? (
        <button onClick={connect}>连接钱包</button>
      ) : (
        <div>
          <p>地址: {address}</p>
          <p>链 ID: {chainId}</p>
          <p>余额: {balance ? ethers.formatEther(balance) : '0'} ETH</p>
          <button onClick={disconnect}>断开连接</button>
        </div>
      )}

      {/* 功能组件 */}
      {isConnected && (
        <>
          <TokenBalance />
          <TransferForm />
        </>
      )}
    </div>
  )
}

/**
 * TypeScript 的优势总结：
 * 
 * 1. 类型安全
 *    - Address 类型确保地址格式正确
 *    - bigint 类型避免精度丢失
 *    - 泛型 <T> 增强复用性
 * 
 * 2. 编译时检查
 *    - 函数参数类型错误会在编译时发现
 *    - 返回值类型不匹配会报错
 *    - 避免运行时崩溃
 * 
 * 3. IDE 智能提示
 *    - 自动补全函数名和参数
 *    - 显示类型信息
 *    - 提升开发效率
 * 
 * 4. 重构更安全
 *    - 修改类型定义，所有使用的地方都会报错
 *    - 不怕改漏
 *    - 易于维护
 */

// 扩展 Window 类型
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, handler: (...args: any[]) => void) => void
      removeListener: (event: string, handler: (...args: any[]) => void) => void
    }
  }
}

export {}
