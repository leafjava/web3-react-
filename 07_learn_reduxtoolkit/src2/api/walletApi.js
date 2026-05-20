/**
 * RTK Query - 钱包 API 示例
 * 
 * 这个文件展示了如何使用 RTK Query 管理 Web3 钱包相关的数据获取
 * 包括：余额查询、交易历史、发送交易等
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// 创建 API Slice
export const walletApi = createApi({
  // 1. reducerPath: 在 Redux store 中的挂载路径
  reducerPath: 'walletApi',
  
  // 2. baseQuery: 基础查询配置（类似 axios 的 baseURL）
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://api.example.com',
    // 可以添加请求头
    prepareHeaders: (headers, { getState }) => {
      // 从 Redux state 中获取 token
      const token = getState().auth?.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  
  // 3. tagTypes: 定义缓存标签类型（用于缓存失效管理）
  tagTypes: ['Balance', 'Transaction', 'NFT'],
  
  // 4. endpoints: 定义所有 API 端点
  endpoints: (builder) => ({
    
    // ==================== Query 示例 ====================
    
    // 查询多链余额
    getBalance: builder.query({
      // query 函数：定义请求参数
      query: ({ address, chainId }) => ({
        url: `/balance/${address}`,
        params: { chainId },
      }),
      
      // providesTags: 提供缓存标签（用于后续失效）
      providesTags: (result, error, { address }) => [
        { type: 'Balance', id: address }
      ],
      
      // 轮询间隔：每 30 秒自动重新获取（适合实时余额）
      // pollingInterval: 30000,
      
      // 数据转换：在返回给组件前处理数据
      transformResponse: (response) => {
        return {
          ...response,
          // 将 Wei 转换为 ETH
          amountInEth: response.amount / 1e18
        }
      },
    }),
    
    // 查询交易历史
    getTransactions: builder.query({
      query: ({ address, chainId, page = 1, limit = 10 }) => ({
        url: `/transactions/${address}`,
        params: { chainId, page, limit },
      }),
      
      providesTags: (result, error, { address }) => 
        result
          ? [
              ...result.transactions.map(({ hash }) => ({ 
                type: 'Transaction', 
                id: hash 
              })),
              { type: 'Transaction', id: 'LIST' }
            ]
          : [{ type: 'Transaction', id: 'LIST' }],
      
      // 合并分页数据（无限滚动场景）
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}-${queryArgs.address}-${queryArgs.chainId}`
      },
      
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems
        }
        return {
          ...newItems,
          transactions: [
            ...currentCache.transactions,
            ...newItems.transactions
          ]
        }
      },
      
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.page !== previousArg?.page
      },
    }),
    
    // 查询单个交易详情
    getTransactionDetail: builder.query({
      query: (txHash) => `/transaction/${txHash}`,
      providesTags: (result, error, txHash) => [
        { type: 'Transaction', id: txHash }
      ],
    }),
    
    // 查询 NFT 列表
    getNFTs: builder.query({
      query: ({ address, chainId }) => ({
        url: `/nfts/${address}`,
        params: { chainId },
      }),
      providesTags: ['NFT'],
    }),
    
    // ==================== Mutation 示例 ====================
    
    // 发送交易
    sendTransaction: builder.mutation({
      query: (txData) => ({
        url: '/transaction/send',
        method: 'POST',
        body: txData,
      }),
      
      // invalidatesTags: 交易成功后自动刷新相关缓存
      invalidatesTags: (result, error, { from }) => [
        { type: 'Balance', id: from },
        { type: 'Transaction', id: 'LIST' },
      ],
      
      // 乐观更新：立即更新 UI，失败时回滚
      async onQueryStarted(txData, { dispatch, queryFulfilled }) {
        // 1. 立即更新余额（乐观更新）
        const patchResult = dispatch(
          walletApi.util.updateQueryData(
            'getBalance',
            { address: txData.from, chainId: txData.chainId },
            (draft) => {
              // 扣除发送金额和 gas 费
              draft.amount -= (txData.value + txData.gasLimit * txData.gasPrice)
            }
          )
        )
        
        try {
          // 2. 等待请求完成
          await queryFulfilled
        } catch {
          // 3. 失败时回滚
          patchResult.undo()
        }
      },
    }),
    
    // 批准代币授权
    approveToken: builder.mutation({
      query: ({ tokenAddress, spender, amount }) => ({
        url: '/token/approve',
        method: 'POST',
        body: { tokenAddress, spender, amount },
      }),
      invalidatesTags: ['Balance'],
    }),
  }),
})

// 自动生成的 Hooks
export const {
  // Query Hooks
  useGetBalanceQuery,
  useGetTransactionsQuery,
  useGetTransactionDetailQuery,
  useGetNFTsQuery,
  
  // Mutation Hooks
  useSendTransactionMutation,
  useApproveTokenMutation,
  
  // Lazy Query Hooks（手动触发）
  useLazyGetBalanceQuery,
  useLazyGetTransactionsQuery,
} = walletApi

/**
 * 使用示例：
 * 
 * // 1. 在组件中使用 Query
 * function WalletBalance({ address, chainId }) {
 *   const { data, isLoading, error, refetch } = useGetBalanceQuery(
 *     { address, chainId },
 *     { 
 *       skip: !address,  // 没有地址时跳过请求
 *       pollingInterval: 30000,  // 每 30 秒轮询
 *     }
 *   )
 *   
 *   if (isLoading) return <div>加载中...</div>
 *   if (error) return <div>错误: {error.message}</div>
 *   
 *   return <div>余额: {data.amountInEth} ETH</div>
 * }
 * 
 * // 2. 在组件中使用 Mutation
 * function SendButton() {
 *   const [sendTx, { isLoading, isSuccess }] = useSendTransactionMutation()
 *   
 *   const handleSend = async () => {
 *     try {
 *       const result = await sendTx({
 *         from: '0x123...',
 *         to: '0x456...',
 *         value: '1000000000000000000',
 *         chainId: 1,
 *       }).unwrap()
 *       
 *       console.log('交易成功:', result.txHash)
 *     } catch (err) {
 *       console.error('交易失败:', err)
 *     }
 *   }
 *   
 *   return <button onClick={handleSend}>发送</button>
 * }
 */
