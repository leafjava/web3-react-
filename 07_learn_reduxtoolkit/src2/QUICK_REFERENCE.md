# RTK Query 快速参考手册

## 📋 目录

1. [基础设置](#基础设置)
2. [Query 查询](#query-查询)
3. [Mutation 修改](#mutation-修改)
4. [缓存管理](#缓存管理)
5. [乐观更新](#乐观更新)
6. [常用选项](#常用选项)
7. [面试要点](#面试要点)

---

## 基础设置

### 1. 创建 API Slice

```javascript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Post', 'User'],
  endpoints: (builder) => ({
    // 定义端点...
  }),
})
```

### 2. 配置 Store

```javascript
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { api } from './api'

const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})

setupListeners(store.dispatch)
```

---

## Query 查询

### 基础查询

```javascript
// 定义
getPost: builder.query({
  query: (id) => `/posts/${id}`,
})

// 使用
const { data, isLoading, error, refetch } = useGetPostQuery(postId)
```

### 带参数查询

```javascript
// 定义
getPosts: builder.query({
  query: ({ page, limit }) => ({
    url: '/posts',
    params: { page, limit },
  }),
})

// 使用
const { data } = useGetPostsQuery({ page: 1, limit: 10 })
```

### 条件查询（skip）

```javascript
const { data } = useGetPostQuery(postId, {
  skip: !postId,  // 没有 ID 时不查询
})
```

### 轮询查询

```javascript
const { data } = useGetPostQuery(postId, {
  pollingInterval: 30000,  // 每 30 秒刷新
})
```

### 懒加载查询

```javascript
const [trigger, result] = useLazyGetPostQuery()

const handleLoad = () => {
  trigger(postId)
}
```

---

## Mutation 修改

### 基础 Mutation

```javascript
// 定义
createPost: builder.mutation({
  query: (newPost) => ({
    url: '/posts',
    method: 'POST',
    body: newPost,
  }),
})

// 使用
const [createPost, { isLoading, isSuccess }] = useCreatePostMutation()

const handleCreate = async () => {
  try {
    const result = await createPost(data).unwrap()
    console.log('成功:', result)
  } catch (err) {
    console.error('失败:', err)
  }
}
```

### Mutation 状态

```javascript
const [trigger, { data, error, isLoading, isSuccess, isError, reset }] = useMutation()
```

---

## 缓存管理

### 提供标签（providesTags）

```javascript
// 单个标签
getPosts: builder.query({
  query: () => '/posts',
  providesTags: ['Post'],
})

// 带 ID 的标签
getPost: builder.query({
  query: (id) => `/posts/${id}`,
  providesTags: (result, error, id) => [{ type: 'Post', id }],
})

// 列表项标签（最佳实践）
getPosts: builder.query({
  query: () => '/posts',
  providesTags: (result) =>
    result
      ? [
          ...result.map(({ id }) => ({ type: 'Post', id })),
          { type: 'Post', id: 'LIST' },
        ]
      : [{ type: 'Post', id: 'LIST' }],
})
```

### 使标签失效（invalidatesTags）

```javascript
// 使所有 Post 失效
createPost: builder.mutation({
  query: (newPost) => ({ url: '/posts', method: 'POST', body: newPost }),
  invalidatesTags: ['Post'],
})

// 使特定 ID 失效
updatePost: builder.mutation({
  query: ({ id, ...patch }) => ({ url: `/posts/${id}`, method: 'PATCH', body: patch }),
  invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
})

// 使多个标签失效
deletePost: builder.mutation({
  query: (id) => ({ url: `/posts/${id}`, method: 'DELETE' }),
  invalidatesTags: (result, error, id) => [
    { type: 'Post', id },
    { type: 'Post', id: 'LIST' },
  ],
})
```

### 手动失效缓存

```javascript
import { useDispatch } from 'react-redux'

const dispatch = useDispatch()

// 失效特定标签
dispatch(api.util.invalidateTags([{ type: 'Post', id: 1 }]))

// 重置整个 API 状态
dispatch(api.util.resetApiState())
```

---

## 乐观更新

### 基础乐观更新

```javascript
updatePost: builder.mutation({
  query: ({ id, ...patch }) => ({
    url: `/posts/${id}`,
    method: 'PATCH',
    body: patch,
  }),
  
  async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
    // 1. 立即更新缓存
    const patchResult = dispatch(
      api.util.updateQueryData('getPost', id, (draft) => {
        Object.assign(draft, patch)
      })
    )
    
    try {
      // 2. 等待请求完成
      await queryFulfilled
    } catch {
      // 3. 失败时回滚
      patchResult.undo()
    }
  },
})
```

### 更新多个查询

```javascript
async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
  // 更新详情
  const patchDetail = dispatch(
    api.util.updateQueryData('getPost', id, (draft) => {
      Object.assign(draft, patch)
    })
  )
  
  // 更新列表
  const patchList = dispatch(
    api.util.updateQueryData('getPosts', undefined, (draft) => {
      const post = draft.find(p => p.id === id)
      if (post) Object.assign(post, patch)
    })
  )
  
  try {
    await queryFulfilled
  } catch {
    patchDetail.undo()
    patchList.undo()
  }
}
```

---

## 常用选项

### Query 选项

```javascript
useGetPostQuery(postId, {
  skip: !postId,                      // 跳过查询
  pollingInterval: 30000,             // 轮询间隔（毫秒）
  refetchOnMountOrArgChange: true,    // 挂载或参数变化时刷新
  refetchOnFocus: true,               // 窗口获得焦点时刷新
  refetchOnReconnect: true,           // 网络重连时刷新
  selectFromResult: ({ data, ...other }) => ({
    ...other,
    firstThree: data?.slice(0, 3),    // 选择部分数据
  }),
})
```

### Mutation 选项

```javascript
useCreatePostMutation({
  fixedCacheKey: 'shared-create',     // 共享 mutation 状态
})
```

---

## 面试要点

### 1. RTK Query vs 传统 Redux

**传统方式：**
- 需要手写 action、reducer、thunk
- 手动管理 loading、error 状态
- 手动处理缓存

**RTK Query：**
- 自动生成 Hooks
- 自动管理状态
- 内置缓存和去重

### 2. 核心概念

- **Query**: 获取数据（GET）
- **Mutation**: 修改数据（POST/PUT/DELETE）
- **Tags**: 缓存标签系统
- **Optimistic Updates**: 乐观更新

### 3. Web3 应用场景

```javascript
// 钱包余额查询
getBalance: builder.query({
  query: ({ address, chainId }) => `/balance/${address}?chainId=${chainId}`,
  providesTags: (result, error, { address }) => [{ type: 'Balance', id: address }],
  pollingInterval: 30000,  // 实时更新
})

// 发送交易（乐观更新）
sendTransaction: builder.mutation({
  query: (txData) => ({ url: '/tx/send', method: 'POST', body: txData }),
  invalidatesTags: (result, error, { from }) => [{ type: 'Balance', id: from }],
  async onQueryStarted(txData, { dispatch, queryFulfilled }) {
    // 立即扣除余额
    const patch = dispatch(
      api.util.updateQueryData('getBalance', { address: txData.from }, (draft) => {
        draft.amount -= txData.value
      })
    )
    try {
      await queryFulfilled
    } catch {
      patch.undo()
    }
  },
})
```

### 4. 与 Wagmi 结合

```javascript
import { useAccount } from 'wagmi'
import { useGetBalanceQuery } from './api'

function useWallet() {
  const { address, chainId } = useAccount()  // Wagmi 管理连接
  const { data: balance } = useGetBalanceQuery(  // RTK Query 管理数据
    { address, chainId },
    { skip: !address }
  )
  return { address, balance }
}
```

### 5. 优势总结

✅ **自动缓存和去重** - 多个组件调用同一接口只请求一次  
✅ **内置状态管理** - loading/error 自动处理  
✅ **轮询和自动刷新** - 适合实时数据  
✅ **缓存失效策略** - Mutation 后自动刷新相关数据  
✅ **乐观更新** - 提升用户体验  
✅ **TypeScript 支持** - 完整的类型推断

---

## 常见问题

### Q: 如何调试缓存？

```javascript
// 在 Redux DevTools 中查看
// 或者手动打印
console.log(store.getState().api)
```

### Q: 如何清空所有缓存？

```javascript
dispatch(api.util.resetApiState())
```

### Q: 如何预加载数据？

```javascript
dispatch(api.util.prefetch('getPost', postId))
```

### Q: 如何设置缓存时间？

```javascript
getPost: builder.query({
  query: (id) => `/posts/${id}`,
  keepUnusedDataFor: 300,  // 缓存 5 分钟
})
```

---

## 学习资源

- 📖 [官方文档](https://redux-toolkit.js.org/rtk-query/overview)
- 💻 [本项目示例代码](./examples/)
- 🎯 [实战组件](./components/)
- 🔧 [自定义 Hooks](./hooks/)

---

**记住：RTK Query 的核心是"自动化"和"缓存管理"，掌握这两点就能应对大部分场景！**
