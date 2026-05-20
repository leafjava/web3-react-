/**
 * 代币列表组件 - 展示多个查询的使用
 * 
 * 演示：
 * 1. 批量查询代币价格
 * 2. 自动去重和缓存
 * 3. 轮询更新
 */

import React from 'react'
import { useGetMultipleTokenPricesQuery } from '../api/tokenApi'

function TokenList() {
  const tokenIds = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana']
  
  const {
    data: prices,
    isLoading,
    isFetching,
    error,
  } = useGetMultipleTokenPricesQuery(tokenIds, {
    // 每 60 秒自动刷新价格
    pollingInterval: 60000,
  })

  if (isLoading) {
    return <div>加载代币价格中...</div>
  }

  if (error) {
    return <div>加载失败: {error.message}</div>
  }

  return (
    <div className="token-list">
      <div className="header">
        <h3>代币价格</h3>
        {isFetching && <span className="updating">更新中...</span>}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>代币</th>
            <th>USD 价格</th>
            <th>ETH 价格</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(prices || {}).map(([tokenId, tokenPrices]) => (
            <tr key={tokenId}>
              <td className="token-name">
                {tokenId.charAt(0).toUpperCase() + tokenId.slice(1)}
              </td>
              <td className="price-usd">
                ${tokenPrices.usd?.toLocaleString()}
              </td>
              <td className="price-eth">
                {tokenPrices.eth?.toFixed(6)} ETH
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TokenList

/**
 * 自动去重示例：
 * 
 * 如果多个组件同时调用相同的查询：
 * 
 * function ComponentA() {
 *   const { data } = useGetMultipleTokenPricesQuery(['bitcoin', 'ethereum'])
 * }
 * 
 * function ComponentB() {
 *   const { data } = useGetMultipleTokenPricesQuery(['bitcoin', 'ethereum'])
 * }
 * 
 * RTK Query 会：
 * 1. 只发送一次网络请求
 * 2. 两个组件共享同一份缓存数据
 * 3. 任一组件卸载后，缓存仍然保留（默认 60 秒）
 */

/**
 * 单个代币价格组件（展示缓存共享）
 */
export function SingleTokenPrice({ tokenId }) {
  const { data, isLoading } = useGetTokenPriceQuery(tokenId)
  
  if (isLoading) return <span>...</span>
  
  return <span>${data?.price}</span>
}

/**
 * 使用场景：
 * 
 * function Dashboard() {
 *   return (
 *     <div>
 *       <TokenList />
 *       
 *       {/* 这些组件会复用 TokenList 的缓存，不会重复请求 */}
 *       <div>
 *         BTC: <SingleTokenPrice tokenId="bitcoin" />
 *         ETH: <SingleTokenPrice tokenId="ethereum" />
 *       </div>
 *     </div>
 *   )
 * }
 */
