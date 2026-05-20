/**
 * 示例 3: 缓存失效策略（Cache Invalidation）
 * 
 * 学习目标：
 * 1. 理解 providesTags 和 invalidatesTags 的工作原理
 * 2. 掌握细粒度的缓存管理
 * 3. 学习如何优化缓存失效策略
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// ==================== 1. 基础缓存标签系统 ====================

export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
  
  // 1. 定义标签类型
  tagTypes: ['Post', 'User', 'Comment'],
  
  endpoints: (builder) => ({
    // ==================== Query 端点 ====================
    
    // 获取所有文章
    getPosts: builder.query({
      query: () => '/posts',
      // 2. 提供标签：这个查询提供了 'Post' 类型的数据
      providesTags: ['Post'],
    }),
    
    // 获取单个文章
    getPostById: builder.query({
      query: (id) => `/posts/${id}`,
      // 3. 提供细粒度标签：包含 ID 的标签
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    
    // 获取用户的文章
    getPostsByUser: builder.query({
      query: (userId) => `/posts?userId=${userId}`,
      // 4. 提供多个标签
      providesTags: (result, error, userId) => [
        'Post',  // 通用标签
        { type: 'Post', id: `USER-${userId}` },  // 用户特定标签
      ],
    }),
    
    // 获取文章评论
    getComments: builder.query({
      query: (postId) => `/posts/${postId}/comments`,
      providesTags: (result, error, postId) => [
        { type: 'Comment', id: `POST-${postId}` },
      ],
    }),
    
    // ==================== Mutation 端点 ====================
    
    // 创建文章
    createPost: builder.mutation({
      query: (newPost) => ({
        url: '/posts',
        method: 'POST',
        body: newPost,
      }),
      // 5. 使标签失效：创建后使所有 'Post' 查询失效
      invalidatesTags: ['Post'],
    }),
    
    // 更新文章
    updatePost: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      // 6. 使特定 ID 的标签失效
      invalidatesTags: (result, error, { id }) => [
        { type: 'Post', id },
      ],
    }),
    
    // 删除文章
    deletePost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'DELETE',
      }),
      // 7. 使多个标签失效
      invalidatesTags: (result, error, id) => [
        { type: 'Post', id },  // 特定文章
        'Post',                 // 所有文章列表
      ],
    }),
    
    // 添加评论
    addComment: builder.mutation({
      query: ({ postId, ...comment }) => ({
        url: '/comments',
        method: 'POST',
        body: { postId, ...comment },
      }),
      // 8. 使评论标签失效
      invalidatesTags: (result, error, { postId }) => [
        { type: 'Comment', id: `POST-${postId}` },
      ],
    }),
  }),
})

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useGetPostsByUserQuery,
  useGetCommentsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useAddCommentMutation,
} = postsApi

// ==================== 2. 缓存失效工作原理 ====================

/**
 * 工作流程：
 * 
 * 1. Query 通过 providesTags 声明它提供了哪些数据
 * 2. Mutation 通过 invalidatesTags 声明它使哪些数据失效
 * 3. 当 Mutation 成功后，RTK Query 自动重新获取所有被失效的查询
 * 
 * 示例：
 * 
 * // 组件 A 查询所有文章
 * function ComponentA() {
 *   const { data } = useGetPostsQuery()  // providesTags: ['Post']
 *   return <PostList posts={data} />
 * }
 * 
 * // 组件 B 创建文章
 * function ComponentB() {
 *   const [createPost] = useCreatePostMutation()  // invalidatesTags: ['Post']
 *   
 *   const handleCreate = async () => {
 *     await createPost({ title: 'New', body: 'New', userId: 1 })
 *     // 创建成功后，ComponentA 的查询会自动重新获取
 *   }
 *   
 *   return <button onClick={handleCreate}>创建</button>
 * }
 */

// ==================== 3. 细粒度缓存管理 ====================

/**
 * 场景：文章列表 + 文章详情
 * 
 * 问题：更新单个文章时，不应该刷新整个列表
 * 解决：使用带 ID 的标签
 */

function PostListAndDetail() {
  // 列表查询
  const { data: posts } = useGetPostsQuery()  // providesTags: ['Post']
  
  // 详情查询
  const { data: post } = useGetPostByIdQuery(1)  // providesTags: [{ type: 'Post', id: 1 }]
  
  // 更新文章
  const [updatePost] = useUpdatePostMutation()  // invalidatesTags: [{ type: 'Post', id: 1 }]
  
  const handleUpdate = async () => {
    await updatePost({ id: 1, title: 'Updated' })
    // 只有 getPostById(1) 会重新获取
    // getPosts() 不会重新获取（因为标签不匹配）
  }
  
  return (
    <div>
      <PostList posts={posts} />
      <PostDetail post={post} onUpdate={handleUpdate} />
    </div>
  )
}

// ==================== 4. 列表项标签模式 ====================

/**
 * 最佳实践：为列表中的每一项提供标签
 * 
 * 好处：
 * 1. 更新单个项时，列表会自动更新
 * 2. 删除项时，列表会自动更新
 * 3. 避免不必要的全量刷新
 */

export const advancedPostsApi = createApi({
  reducerPath: 'advancedPostsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
  tagTypes: ['Post'],
  
  endpoints: (builder) => ({
    // 获取文章列表
    getPosts: builder.query({
      query: () => '/posts',
      // 为列表中的每一项提供标签
      providesTags: (result) =>
        result
          ? [
              // 为每个文章提供单独的标签
              ...result.map(({ id }) => ({ type: 'Post', id })),
              // 提供一个 'LIST' 标签用于整体刷新
              { type: 'Post', id: 'LIST' },
            ]
          : [{ type: 'Post', id: 'LIST' }],
    }),
    
    // 创建文章
    createPost: builder.mutation({
      query: (newPost) => ({
        url: '/posts',
        method: 'POST',
        body: newPost,
      }),
      // 只使 LIST 标签失效，不影响单个文章的缓存
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
    
    // 更新文章
    updatePost: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      // 使特定文章和列表都失效
      invalidatesTags: (result, error, { id }) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),
    
    // 删除文章
    deletePost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'DELETE',
      }),
      // 使特定文章和列表都失效
      invalidatesTags: (result, error, id) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),
  }),
})

// ==================== 5. 条件失效 ====================

/**
 * 根据结果决定是否失效缓存
 */

export const conditionalApi = createApi({
  reducerPath: 'conditionalApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.example.com' }),
  tagTypes: ['Post'],
  
  endpoints: (builder) => ({
    updatePost: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      // 根据结果决定失效哪些标签
      invalidatesTags: (result, error, { id, shouldInvalidateList }) => {
        const tags = [{ type: 'Post', id }]
        
        // 只有在需要时才失效列表
        if (shouldInvalidateList) {
          tags.push({ type: 'Post', id: 'LIST' })
        }
        
        return tags
      },
    }),
  }),
})

// ==================== 6. 手动失效缓存 ====================

/**
 * 使用 dispatch 手动失效缓存
 */

import { useDispatch } from 'react-redux'

function ManualInvalidation() {
  const dispatch = useDispatch()
  
  const handleInvalidate = () => {
    // 方式 1: 失效特定标签
    dispatch(
      postsApi.util.invalidateTags([{ type: 'Post', id: 1 }])
    )
    
    // 方式 2: 失效所有 Post 标签
    dispatch(
      postsApi.util.invalidateTags(['Post'])
    )
  }
  
  return <button onClick={handleInvalidate}>手动刷新</button>
}

// ==================== 7. 重置 API 状态 ====================

/**
 * 清空所有缓存（例如用户登出时）
 */

function ResetApiState() {
  const dispatch = useDispatch()
  
  const handleLogout = () => {
    // 重置整个 API 状态
    dispatch(postsApi.util.resetApiState())
  }
  
  return <button onClick={handleLogout}>登出</button>
}

// ==================== 8. 实战场景 ====================

/**
 * 场景 1: 社交媒体应用
 * 
 * 需求：
 * - 点赞文章后，文章详情和列表都要更新
 * - 评论文章后，只更新评论区，不刷新文章
 */

export const socialApi = createApi({
  reducerPath: 'socialApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.example.com' }),
  tagTypes: ['Post', 'Comment', 'Like'],
  
  endpoints: (builder) => ({
    // 获取文章（包含点赞数）
    getPost: builder.query({
      query: (id) => `/posts/${id}`,
      providesTags: (result, error, id) => [
        { type: 'Post', id },
        { type: 'Like', id: `POST-${id}` },
      ],
    }),
    
    // 获取评论
    getComments: builder.query({
      query: (postId) => `/posts/${postId}/comments`,
      providesTags: (result, error, postId) => [
        { type: 'Comment', id: `POST-${postId}` },
      ],
    }),
    
    // 点赞文章
    likePost: builder.mutation({
      query: (postId) => ({
        url: `/posts/${postId}/like`,
        method: 'POST',
      }),
      // 使文章和点赞数失效
      invalidatesTags: (result, error, postId) => [
        { type: 'Post', id: postId },
        { type: 'Like', id: `POST-${postId}` },
      ],
    }),
    
    // 添加评论
    addComment: builder.mutation({
      query: ({ postId, ...comment }) => ({
        url: '/comments',
        method: 'POST',
        body: { postId, ...comment },
      }),
      // 只使评论失效，不影响文章
      invalidatesTags: (result, error, { postId }) => [
        { type: 'Comment', id: `POST-${postId}` },
      ],
    }),
  }),
})

/**
 * 场景 2: 电商应用
 * 
 * 需求：
 * - 添加到购物车后，更新购物车数量
 * - 不影响商品列表的缓存
 */

export const shopApi = createApi({
  reducerPath: 'shopApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.shop.com' }),
  tagTypes: ['Product', 'Cart'],
  
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => '/products',
      providesTags: ['Product'],
    }),
    
    getCart: builder.query({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),
    
    addToCart: builder.mutation({
      query: (productId) => ({
        url: '/cart',
        method: 'POST',
        body: { productId },
      }),
      // 只更新购物车，不刷新商品列表
      invalidatesTags: ['Cart'],
    }),
  }),
})

// ==================== 9. 调试技巧 ====================

/**
 * 查看当前缓存状态
 */

function DebugCache() {
  const dispatch = useDispatch()
  
  const handleLog = () => {
    // 获取当前 API 状态
    const state = store.getState()
    console.log('Posts API 缓存:', state.postsApi)
  }
  
  return <button onClick={handleLog}>查看缓存</button>
}

export {
  PostListAndDetail,
  ManualInvalidation,
  ResetApiState,
  DebugCache,
}

/**
 * 总结：
 * 
 * 1. 使用 tagTypes 定义标签类型
 * 2. Query 用 providesTags 声明提供的数据
 * 3. Mutation 用 invalidatesTags 声明使哪些数据失效
 * 4. 使用带 ID 的标签实现细粒度控制
 * 5. 列表查询应该为每一项提供标签
 * 6. 使用 'LIST' 标签管理整体刷新
 * 7. 可以手动失效缓存或重置 API 状态
 */
