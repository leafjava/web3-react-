/**
 * RTK Query - 代币价格 API 示例
 * 
 * 展示如何管理代币价格、实时更新、缓存失效等场景
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const tokenApi = createApi({
  reducerPath: 'tokenApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.coingecko.com/api/v3' }),
  tagTypes: ['TokenPrice', 'TokenInfo'],
  
  endpoints: (builder) => ({
    
    // 获取代币价格
    getTokenPrice: builder.query({
      query: (tokenId) => `/simple/price?ids=${tokenId}&vs_currencies=usd`,
      
      // 提供细粒度的缓存标签
      providesTags: (result, error, tokenId) => [
        { type: 'TokenPrice', id: tokenId }
      ],
      
      // 每 60 秒自动刷新价格
      pollingInterval: 60000,
      
      // 数据转换
      transformResponse: (response, meta, tokenId) => {
        return {
          tokenId,
          price: response[tokenId]?.usd || 0,
          timestamp: Date.now()
        }
      },
    }),
    
    // 批量获取代币价格
    getMultipleTokenPrices: builder.query({
      query: (tokenIds) => {
        const ids = tokenIds.join(',')
        return `/simple/price?ids=${ids}&vs_currencies=usd,eth`
      },
      
      providesTags: (result, error, tokenIds) => 
        tokenIds.map(id => ({ type: 'TokenPrice', id })),
    }),
    
    // 获取代币详细信息
    getTokenInfo: builder.query({
      query: (tokenId) => `/coins/${tokenId}`,
      providesTags: (result, error, tokenId) => [
        { type: 'TokenInfo', id: tokenId }
      ],
      
      // 缓存 5 分钟（代币信息不常变）
      keepUnusedDataFor: 300,
    }),
    
    // 更新代币价格（模拟 Mutation）
    updateTokenPrice: builder.mutation({
      query: ({ tokenId, price }) => ({
        url: `/admin/price/${tokenId}`,
        method: 'PUT',
        body: { price },
      }),
      
      // 更新后自动刷新对应的价格查询
      invalidatesTags: (result, error, { tokenId }) => [
        { type: 'TokenPrice', id: tokenId }
      ],
    }),
    
    // 订阅代币价格（WebSocket 模拟）
    subscribeTokenPrice: builder.query({
      queryFn: () => ({ data: null }),
      
      async onCacheEntryAdded(
        tokenId,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        // 等待初始查询完成
        await cacheDataLoaded
        
        // 模拟 WebSocket 连接
        const ws = new WebSocket(`wss://stream.example.com/price/${tokenId}`)
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          
          // 实时更新缓存数据
          updateCachedData((draft) => {
            Object.assign(draft, data)
          })
        }
        
        // 清理：组件卸载时关闭 WebSocket
        await cacheEntryRemoved
        ws.close()
      },
    }),
  }),
})

export const {
  useGetTokenPriceQuery,
  useGetMultipleTokenPricesQuery,
  useGetTokenInfoQuery,
  useUpdateTokenPriceMutation,
  useSubscribeTokenPriceQuery,
} = tokenApi

/**
 * 使用示例：
 * 
 * // 1. 单个代币价格
 * function TokenPrice({ tokenId }) {
 *   const { data, isLoading } = useGetTokenPriceQuery(tokenId, {
 *     pollingInterval: 60000,  // 每分钟更新
 *   })
 *   
 *   return <div>${data?.price}</div>
 * }
 * 
 * // 2. 批量代币价格
 * function TokenList() {
 *   const { data } = useGetMultipleTokenPricesQuery([
 *     'bitcoin',
 *     'ethereum',
 *     'binancecoin'
 *   ])
 *   
 *   return (
 *     <ul>
 *       {Object.entries(data || {}).map(([id, prices]) => (
 *         <li key={id}>{id}: ${prices.usd}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * 
 * // 3. 手动刷新价格
 * function RefreshButton() {
 *   const [updatePrice] = useUpdateTokenPriceMutation()
 *   
 *   const handleRefresh = () => {
 *     updatePrice({ tokenId: 'bitcoin', price: 50000 })
 *     // 这会自动触发所有使用 bitcoin 价格的组件重新获取数据
 *   }
 *   
 *   return <button onClick={handleRefresh}>刷新</button>
 * }
 */
