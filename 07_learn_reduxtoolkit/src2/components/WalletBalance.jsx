/**
 * 钱包余额组件 - RTK Query 实战示例
 * 
 * 展示如何使用 useGetBalanceQuery Hook
 */

import React from 'react'
import { useGetBalanceQuery } from '../api/walletApi'

function WalletBalance({ address, chainId }) {
  // 使用 RTK Query 生成的 Hook
  const {
    data: balance,        // 返回的数据
    isLoading,            // 加载状态
    isFetching,           // 后台刷新状态（区别于 isLoading）
    isError,              // 错误状态
    error,                // 错误对象
    refetch,              // 手动刷新函数
    isSuccess,            // 成功状态
  } = useGetBalanceQuery(
    // 1. 查询参数
    { address, chainId },
    
    // 2. 查询选项
    {
      // 跳过查询：没有地址时不发送请求
      skip: !address,
      
      // 轮询间隔：每 30 秒自动刷新（适合实时余额）
      pollingInterval: 30000,
      
      // 窗口重新获得焦点时刷新
      refetchOnFocus: true,
      
      // 网络重新连接时刷新
      refetchOnReconnect: true,
      
      // 选择部分数据（类似 Redux 的 selector）
      selectFromResult: ({ data, ...other }) => ({
        data,
        ...other,
        // 可以在这里添加派生数据
        hasBalance: data && data.amount > 0,
      }),
    }
  )

  // 加载状态
  if (isLoading) {
    return (
      <div className="wallet-balance loading">
        <div className="spinner"></div>
        <p>加载余额中...</p>
      </div>
    )
  }

  // 错误状态
  if (isError) {
    return (
      <div className="wallet-balance error">
        <p>❌ 加载失败: {error?.data?.message || error?.error}</p>
        <button onClick={refetch}>重试</button>
      </div>
    )
  }

  // 成功状态
  if (isSuccess && balance) {
    return (
      <div className="wallet-balance success">
        <div className="balance-info">
          <h3>钱包余额</h3>
          <p className="amount">{balance.amountInEth} ETH</p>
          <p className="address">地址: {address.slice(0, 6)}...{address.slice(-4)}</p>
          <p className="chain">链 ID: {chainId}</p>
        </div>
        
        <div className="actions">
          <button onClick={refetch} disabled={isFetching}>
            {isFetching ? '刷新中...' : '🔄 刷新'}
          </button>
        </div>
        
        {/* 显示后台刷新状态 */}
        {isFetching && !isLoading && (
          <div className="fetching-indicator">
            <small>正在更新...</small>
          </div>
        )}
      </div>
    )
  }

  return null
}

export default WalletBalance

/**
 * 关键概念：
 * 
 * 1. isLoading vs isFetching
 *    - isLoading: 首次加载时为 true
 *    - isFetching: 任何时候获取数据时为 true（包括后台刷新）
 * 
 * 2. skip 选项
 *    - 当条件不满足时跳过请求
 *    - 避免无效的 API 调用
 * 
 * 3. pollingInterval
 *    - 自动轮询，适合需要实时更新的数据
 *    - 设置为 0 或不设置则禁用轮询
 * 
 * 4. refetch 函数
 *    - 手动触发重新获取
 *    - 返回 Promise，可以 await
 * 
 * 5. selectFromResult
 *    - 选择部分数据，避免不必要的重新渲染
 *    - 可以添加派生数据
 */

/**
 * 使用示例：
 * 
 * function App() {
 *   const { address, chainId } = useWallet()
 *   
 *   return (
 *     <div>
 *       <WalletBalance address={address} chainId={chainId} />
 *     </div>
 *   )
 * }
 */

/**
 * 高级用法：条件查询
 * 
 * function ConditionalBalance() {
 *   const [showBalance, setShowBalance] = useState(false)
 *   
 *   const { data } = useGetBalanceQuery(
 *     { address: '0x123', chainId: 1 },
 *     { skip: !showBalance }  // 只有当 showBalance 为 true 时才查询
 *   )
 *   
 *   return (
 *     <div>
 *       <button onClick={() => setShowBalance(true)}>
 *         显示余额
 *       </button>
 *       {data && <p>{data.amountInEth} ETH</p>}
 *     </div>
 *   )
 * }
 */
