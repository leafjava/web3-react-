/**
 * 自定义 Hook - 结合 Wagmi 和 RTK Query
 * 
 * 展示如何将钱包连接状态（Wagmi）和数据获取（RTK Query）结合使用
 */

// 注意：这里假设你已经安装了 wagmi
// npm install wagmi viem

// import { useAccount, useBalance } from 'wagmi'
import { useGetBalanceQuery, useGetTransactionsQuery } from '../api/walletApi'

/**
 * 结合 Wagmi 和 RTK Query 的自定义 Hook
 * 
 * Wagmi 负责：
 * - 钱包连接状态
 * - 链切换
 * - 签名交易
 * 
 * RTK Query 负责：
 * - 服务端数据获取（余额、交易历史、NFT 等）
 * - 数据缓存和同步
 */
export function useWalletWithRTK() {
  // 1. 从 Wagmi 获取钱包连接状态
  // const { address, chainId, isConnected } = useAccount()
  
  // 模拟数据（实际使用时替换为 Wagmi）
  const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
  const chainId = 1
  const isConnected = true
  
  // 2. 使用 RTK Query 获取余额
  const {
    data: balance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useGetBalanceQuery(
    { address, chainId },
    {
      skip: !isConnected || !address,  // 未连接时跳过
      pollingInterval: 30000,          // 每 30 秒更新
    }
  )
  
  // 3. 使用 RTK Query 获取交易历史
  const {
    data: transactions,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions,
  } = useGetTransactionsQuery(
    { address, chainId, page: 1, limit: 10 },
    {
      skip: !isConnected || !address,
    }
  )
  
  // 4. 返回统一的接口
  return {
    // 钱包状态
    address,
    chainId,
    isConnected,
    
    // 余额数据
    balance: balance?.amountInEth,
    balanceRaw: balance?.amount,
    isBalanceLoading,
    refetchBalance,
    
    // 交易数据
    transactions: transactions?.transactions || [],
    transactionCount: transactions?.total || 0,
    isTransactionsLoading,
    refetchTransactions,
    
    // 统一刷新
    refetchAll: () => {
      refetchBalance()
      refetchTransactions()
    },
  }
}

/**
 * 使用示例：
 * 
 * function WalletDashboard() {
 *   const {
 *     address,
 *     balance,
 *     transactions,
 *     isBalanceLoading,
 *     refetchAll,
 *   } = useWalletWithRTK()
 *   
 *   if (!address) {
 *     return <ConnectWalletButton />
 *   }
 *   
 *   return (
 *     <div>
 *       <h2>我的钱包</h2>
 *       <p>地址: {address}</p>
 *       <p>余额: {balance} ETH</p>
 *       
 *       <h3>最近交易</h3>
 *       <ul>
 *         {transactions.map(tx => (
 *           <li key={tx.hash}>{tx.hash}</li>
 *         ))}
 *       </ul>
 *       
 *       <button onClick={refetchAll}>刷新所有数据</button>
 *     </div>
 *   )
 * }
 */

/**
 * 多链支持示例
 */
export function useMultiChainBalance(chains = [1, 56, 137]) {
  // const { address } = useAccount()
  const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
  
  // 为每条链创建查询
  const balanceQueries = chains.map(chainId => 
    useGetBalanceQuery(
      { address, chainId },
      { skip: !address }
    )
  )
  
  // 聚合所有链的余额
  const totalBalance = balanceQueries.reduce((sum, query) => {
    return sum + (query.data?.amountInEth || 0)
  }, 0)
  
  const isLoading = balanceQueries.some(q => q.isLoading)
  
  return {
    balances: balanceQueries.map((q, i) => ({
      chainId: chains[i],
      balance: q.data?.amountInEth || 0,
      isLoading: q.isLoading,
    })),
    totalBalance,
    isLoading,
  }
}

/**
 * 使用多链余额：
 * 
 * function MultiChainWallet() {
 *   const { balances, totalBalance } = useMultiChainBalance([1, 56, 137])
 *   
 *   return (
 *     <div>
 *       <h3>总余额: {totalBalance} ETH</h3>
 *       {balances.map(({ chainId, balance }) => (
 *         <div key={chainId}>
 *           链 {chainId}: {balance} ETH
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 */

/**
 * 懒加载查询示例
 */
export function useLazyWalletData() {
  const [trigger, result] = useLazyGetBalanceQuery()
  
  const loadBalance = (address, chainId) => {
    return trigger({ address, chainId })
  }
  
  return {
    loadBalance,
    ...result,
  }
}

/**
 * 使用懒加载：
 * 
 * function SearchWallet() {
 *   const [address, setAddress] = useState('')
 *   const { loadBalance, data, isLoading } = useLazyWalletData()
 *   
 *   const handleSearch = () => {
 *     loadBalance(address, 1)
 *   }
 *   
 *   return (
 *     <div>
 *       <input value={address} onChange={e => setAddress(e.target.value)} />
 *       <button onClick={handleSearch}>查询余额</button>
 *       {data && <p>余额: {data.amountInEth} ETH</p>}
 *     </div>
 *   )
 * }
 */
