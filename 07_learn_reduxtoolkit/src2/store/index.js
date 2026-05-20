/**
 * Redux Store 配置 - 集成 RTK Query
 * 
 * 关键点：
 * 1. 将 API slice 的 reducer 添加到 store
 * 2. 添加 API middleware 以启用缓存、失效、轮询等功能
 */

import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

// 导入 API slices
import { walletApi } from '../api/walletApi'
import { tokenApi } from '../api/tokenApi'

// 可能还有其他普通的 slice
// import userReducer from './features/userSlice'

const store = configureStore({
  reducer: {
    // 1. 添加 RTK Query 的 reducer
    [walletApi.reducerPath]: walletApi.reducer,
    [tokenApi.reducerPath]: tokenApi.reducer,
    
    // 2. 其他普通的 reducer
    // user: userReducer,
  },
  
  // 3. 添加 RTK Query 的 middleware（必须！）
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(walletApi.middleware)
      .concat(tokenApi.middleware),
})

// 4. 启用 refetchOnFocus 和 refetchOnReconnect 行为（可选但推荐）
// 当窗口重新获得焦点或网络重新连接时，自动重新获取数据
setupListeners(store.dispatch)

export default store

/**
 * setupListeners 的作用：
 * 
 * - refetchOnFocus: 当用户切换回浏览器标签页时，自动刷新数据
 * - refetchOnReconnect: 当网络重新连接时，自动刷新数据
 * 
 * 使用示例：
 * 
 * const { data } = useGetBalanceQuery(
 *   { address, chainId },
 *   {
 *     refetchOnFocus: true,      // 标签页重新激活时刷新
 *     refetchOnReconnect: true,  // 网络重连时刷新
 *   }
 * )
 */

/**
 * 在 React 应用中使用：
 * 
 * // index.js 或 App.js
 * import { Provider } from 'react-redux'
 * import store from './store'
 * 
 * function App() {
 *   return (
 *     <Provider store={store}>
 *       <YourApp />
 *     </Provider>
 *   )
 * }
 */
