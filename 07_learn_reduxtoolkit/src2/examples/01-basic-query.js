/**
 * 示例 1: 基础查询（Query）
 * 
 * 学习目标：
 * 1. 理解 RTK Query 的基本查询流程
 * 2. 掌握 useQuery Hook 的使用
 * 3. 了解查询状态管理
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// ==================== 1. 创建 API ====================

export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
  endpoints: (builder) => ({
    // 定义一个查询端点
    getPosts: builder.query({
      query: () => '/posts',
    }),
    
    // 带参数的查询
    getPostById: builder.query({
      query: (id) => `/posts/${id}`,
    }),
    
    // 带多个参数的查询
    getPostsByUser: builder.query({
      query: ({ userId, limit = 10 }) => ({
        url: '/posts',
        params: { userId, _limit: limit },
      }),
    }),
  }),
})

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useGetPostsByUserQuery,
} = postsApi

// ==================== 2. 在组件中使用 ====================

/**
 * 示例 2.1: 最简单的查询
 */
function PostsList() {
  const { data, isLoading, isError, error } = useGetPostsQuery()
  
  if (isLoading) return <div>加载中...</div>
  if (isError) return <div>错误: {error.message}</div>
  
  return (
    <ul>
      {data?.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

/**
 * 示例 2.2: 带参数的查询
 */
function PostDetail({ postId }) {
  const { data: post, isLoading } = useGetPostByIdQuery(postId)
  
  if (isLoading) return <div>加载中...</div>
  
  return (
    <div>
      <h2>{post?.title}</h2>
      <p>{post?.body}</p>
    </div>
  )
}

/**
 * 示例 2.3: 条件查询（skip）
 */
function ConditionalPost({ postId, shouldFetch }) {
  const { data, isLoading } = useGetPostByIdQuery(postId, {
    skip: !shouldFetch,  // 当 shouldFetch 为 false 时不发送请求
  })
  
  if (!shouldFetch) return <div>点击按钮加载</div>
  if (isLoading) return <div>加载中...</div>
  
  return <div>{data?.title}</div>
}

/**
 * 示例 2.4: 手动刷新
 */
function PostWithRefresh({ postId }) {
  const { data, isLoading, refetch } = useGetPostByIdQuery(postId)
  
  return (
    <div>
      {isLoading ? (
        <div>加载中...</div>
      ) : (
        <div>
          <h2>{data?.title}</h2>
          <button onClick={refetch}>刷新</button>
        </div>
      )}
    </div>
  )
}

/**
 * 示例 2.5: 轮询查询
 */
function PollingPosts() {
  const { data, isFetching } = useGetPostsQuery(undefined, {
    pollingInterval: 5000,  // 每 5 秒自动刷新
  })
  
  return (
    <div>
      {isFetching && <span>更新中...</span>}
      <ul>
        {data?.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  )
}

/**
 * 示例 2.6: 选择部分数据（selectFromResult）
 */
function FirstThreePosts() {
  const { firstThree, isLoading } = useGetPostsQuery(undefined, {
    selectFromResult: ({ data, ...other }) => ({
      ...other,
      firstThree: data?.slice(0, 3),
    }),
  })
  
  if (isLoading) return <div>加载中...</div>
  
  return (
    <ul>
      {firstThree?.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

// ==================== 3. 查询状态详解 ====================

/**
 * useQuery Hook 返回的状态：
 * 
 * {
 *   data,              // 查询返回的数据
 *   error,             // 错误对象
 *   isLoading,         // 首次加载状态
 *   isFetching,        // 任何时候获取数据的状态（包括后台刷新）
 *   isSuccess,         // 成功状态
 *   isError,           // 错误状态
 *   isUninitialized,   // 查询尚未开始
 *   refetch,           // 手动刷新函数
 *   startedTimeStamp,  // 查询开始时间戳
 *   fulfilledTimeStamp,// 查询完成时间戳
 * }
 */

/**
 * isLoading vs isFetching 的区别：
 * 
 * isLoading:
 * - 只在首次加载时为 true
 * - 有缓存数据时为 false
 * - 适合显示骨架屏
 * 
 * isFetching:
 * - 任何时候获取数据都为 true
 * - 包括后台刷新、轮询等
 * - 适合显示刷新指示器
 */

function LoadingVsFetching() {
  const { data, isLoading, isFetching } = useGetPostsQuery()
  
  return (
    <div>
      {/* 首次加载显示骨架屏 */}
      {isLoading && <div>骨架屏...</div>}
      
      {/* 后台刷新显示小图标 */}
      {isFetching && !isLoading && <span>🔄</span>}
      
      {/* 数据展示 */}
      {data && (
        <ul>
          {data.map(post => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ==================== 4. 查询选项详解 ====================

/**
 * useQuery 的第二个参数（选项）：
 * 
 * {
 *   skip: boolean,                    // 跳过查询
 *   pollingInterval: number,          // 轮询间隔（毫秒）
 *   refetchOnMountOrArgChange: boolean | number,  // 挂载或参数变化时重新获取
 *   refetchOnFocus: boolean,          // 窗口获得焦点时重新获取
 *   refetchOnReconnect: boolean,      // 网络重连时重新获取
 *   selectFromResult: function,       // 选择部分数据
 * }
 */

function QueryOptionsExample({ userId }) {
  const { data } = useGetPostsByUserQuery(
    { userId, limit: 5 },
    {
      // 没有 userId 时跳过
      skip: !userId,
      
      // 每 10 秒轮询
      pollingInterval: 10000,
      
      // 窗口重新获得焦点时刷新
      refetchOnFocus: true,
      
      // 网络重连时刷新
      refetchOnReconnect: true,
      
      // 参数变化后 5 秒内不重新获取
      refetchOnMountOrArgChange: 5,
      
      // 只选择标题
      selectFromResult: ({ data, ...other }) => ({
        ...other,
        titles: data?.map(post => post.title),
      }),
    }
  )
  
  return (
    <ul>
      {data?.titles?.map((title, i) => (
        <li key={i}>{title}</li>
      ))}
    </ul>
  )
}

// ==================== 5. 实战技巧 ====================

/**
 * 技巧 1: 多个组件共享查询
 * 
 * 当多个组件使用相同的查询参数时，RTK Query 会：
 * 1. 只发送一次网络请求
 * 2. 所有组件共享同一份缓存
 * 3. 任一组件触发刷新，所有组件都会更新
 */

function ComponentA() {
  const { data } = useGetPostByIdQuery(1)
  return <div>{data?.title}</div>
}

function ComponentB() {
  const { data } = useGetPostByIdQuery(1)  // 不会重复请求
  return <div>{data?.body}</div>
}

/**
 * 技巧 2: 懒加载查询
 */
import { useLazyGetPostByIdQuery } from './postsApi'

function LazyLoadPost() {
  const [trigger, result] = useLazyGetPostByIdQuery()
  
  const handleLoad = () => {
    trigger(1)  // 手动触发查询
  }
  
  return (
    <div>
      <button onClick={handleLoad}>加载文章</button>
      {result.data && <div>{result.data.title}</div>}
    </div>
  )
}

/**
 * 技巧 3: 预加载数据
 */
import { useEffect } from 'react'
import { postsApi } from './postsApi'
import { useDispatch } from 'react-redux'

function PrefetchExample() {
  const dispatch = useDispatch()
  
  const handleMouseEnter = (postId) => {
    // 鼠标悬停时预加载数据
    dispatch(
      postsApi.util.prefetch('getPostById', postId, { force: false })
    )
  }
  
  return (
    <div onMouseEnter={() => handleMouseEnter(1)}>
      悬停预加载
    </div>
  )
}

export {
  PostsList,
  PostDetail,
  ConditionalPost,
  PostWithRefresh,
  PollingPosts,
  FirstThreePosts,
  LoadingVsFetching,
  QueryOptionsExample,
  ComponentA,
  ComponentB,
  LazyLoadPost,
  PrefetchExample,
}
