/**
 * 发送交易组件 - RTK Query Mutation 示例
 * 
 * 展示如何使用 useSendTransactionMutation Hook
 */

import React, { useState } from 'react'
import { useSendTransactionMutation } from '../api/walletApi'

function SendTransaction({ fromAddress, chainId }) {
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  
  // 使用 Mutation Hook
  const [
    sendTransaction,      // 触发函数
    {
      isLoading,          // 加载状态
      isSuccess,          // 成功状态
      isError,            // 错误状态
      error,              // 错误对象
      data,               // 返回的数据
      reset,              // 重置状态函数
    }
  ] = useSendTransactionMutation()

  // 处理发送交易
  const handleSend = async (e) => {
    e.preventDefault()
    
    try {
      // 方式 1: 使用 unwrap() 获取 Promise（推荐）
      const result = await sendTransaction({
        from: fromAddress,
        to: toAddress,
        value: (parseFloat(amount) * 1e18).toString(), // ETH 转 Wei
        chainId: chainId,
        gasLimit: 21000,
        gasPrice: '20000000000', // 20 Gwei
      }).unwrap()
      
      console.log('✅ 交易成功:', result.txHash)
      alert(`交易成功！\nTx Hash: ${result.txHash}`)
      
      // 清空表单
      setToAddress('')
      setAmount('')
      
    } catch (err) {
      // unwrap() 会在失败时抛出错误
      console.error('❌ 交易失败:', err)
      alert(`交易失败: ${err.data?.message || err.message}`)
    }
  }

  // 重置表单和状态
  const handleReset = () => {
    setToAddress('')
    setAmount('')
    reset() // 重置 mutation 状态
  }

  return (
    <div className="send-transaction">
      <h3>发送交易</h3>
      
      <form onSubmit={handleSend}>
        <div className="form-group">
          <label>发送地址:</label>
          <input
            type="text"
            value={fromAddress}
            disabled
            placeholder="连接钱包后显示"
          />
        </div>
        
        <div className="form-group">
          <label>接收地址:</label>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>
        
        <div className="form-group">
          <label>金额 (ETH):</label>
          <input
            type="number"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            required
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            disabled={isLoading || !fromAddress}
          >
            {isLoading ? '发送中...' : '发送交易'}
          </button>
          
          <button 
            type="button" 
            onClick={handleReset}
            disabled={isLoading}
          >
            重置
          </button>
        </div>
      </form>
      
      {/* 成功提示 */}
      {isSuccess && data && (
        <div className="success-message">
          <p>✅ 交易已提交</p>
          <p>Tx Hash: {data.txHash}</p>
          <a 
            href={`https://etherscan.io/tx/${data.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            在 Etherscan 查看
          </a>
        </div>
      )}
      
      {/* 错误提示 */}
      {isError && (
        <div className="error-message">
          <p>❌ 交易失败</p>
          <p>{error?.data?.message || error?.error}</p>
        </div>
      )}
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>正在发送交易...</p>
          <small>请在钱包中确认</small>
        </div>
      )}
    </div>
  )
}

export default SendTransaction

/**
 * Mutation Hook 返回值详解：
 * 
 * [trigger, result] = useMutation()
 * 
 * trigger: 触发函数
 *   - 调用后返回 Promise
 *   - 可以使用 .unwrap() 获取原始 Promise
 * 
 * result: 结果对象
 *   - isLoading: 请求进行中
 *   - isSuccess: 请求成功
 *   - isError: 请求失败
 *   - data: 成功时的返回数据
 *   - error: 失败时的错误对象
 *   - reset: 重置状态函数
 */

/**
 * unwrap() vs 不使用 unwrap()
 * 
 * // 使用 unwrap()（推荐）
 * try {
 *   const result = await sendTx(data).unwrap()
 *   console.log(result)  // 直接获取数据
 * } catch (err) {
 *   console.error(err)   // 捕获错误
 * }
 * 
 * // 不使用 unwrap()
 * const result = await sendTx(data)
 * if (result.data) {
 *   console.log(result.data)  // 需要访问 .data
 * } else if (result.error) {
 *   console.error(result.error)  // 需要访问 .error
 * }
 */

/**
 * 自动缓存失效：
 * 
 * 在 walletApi.js 中定义了：
 * 
 * sendTransaction: builder.mutation({
 *   invalidatesTags: (result, error, { from }) => [
 *     { type: 'Balance', id: from },
 *     { type: 'Transaction', id: 'LIST' },
 *   ],
 * })
 * 
 * 这意味着：
 * 1. 交易成功后，自动刷新发送地址的余额
 * 2. 自动刷新交易列表
 * 3. 所有使用这些数据的组件会自动更新
 * 4. 不需要手动调用 refetch()
 */

/**
 * 乐观更新示例：
 * 
 * 在 walletApi.js 中的 onQueryStarted 钩子：
 * 
 * async onQueryStarted(txData, { dispatch, queryFulfilled }) {
 *   // 1. 立即更新 UI（乐观更新）
 *   const patchResult = dispatch(
 *     walletApi.util.updateQueryData('getBalance', args, (draft) => {
 *       draft.amount -= txData.value
 *     })
 *   )
 *   
 *   try {
 *     await queryFulfilled  // 等待请求完成
 *   } catch {
 *     patchResult.undo()    // 失败时回滚
 *   }
 * }
 * 
 * 这样用户会立即看到余额减少，提升体验
 */
