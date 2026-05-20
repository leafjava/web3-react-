/**
 * 示例 4: 乐观更新（Optimistic Updates）
 * 
 * 学习目标：
 * 1. 理解乐观更新的概念和应用场景
 * 2. 掌握 onQueryStarted 钩子的使用
 * 3. 学习如何在失败时回滚更新
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// ==================== 1. 什么是乐观更新？ ====================

/**
 * 乐观更新（Optimistic Update）：
 * 
 * 传统流程：
 * 1. 用户点击按钮
 * 2. 发送请求
 * 3. 等待响应
 * 4. 更新 UI
 * 
 * 乐观更新流程：
 * 1. 用户点击按钮
 * 2. 立即更新 UI（假设会成功）
 * 3. 发送请求
 * 4. 如果成功：保持 UI
 * 5. 如果失败：回滚 UI
 * 
 * 优点：
 * - 用户体验更好（即时反馈）
 * - 减少等待时间
 * 
 * 适用场景：
 * - 点赞/收藏
 * - 简单的增删改操作
 * - 成功率高的操作
 */

// ==================== 2. 基础乐观更新 ====================

export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
  tagTypes: ['Post'],
  
  endpoints: (builder) => ({
    // 获取文章列表
    getPosts: builder.query({
      query: () => '/posts',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Post', id })), { type: 'Post', id: 'LIST' }]
          : [{ type: 'Post', id: 'LIST' }],
    }),
    
    // 获取单个文章
    getPostById: builder.query({
      query: (id) => `/posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    
    // 更新文章（带乐观更新）
    updatePost: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      
      // onQueryStarted: 在请求开始时执行
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        // 1. 立即更新缓存（乐观更新）
        const patchResult = dispatch(
          postsApi.util.updateQueryData('getPostById', id, (draft) => {
            // 直接修改 draft 对象（Immer 会处理不可变性）
            Object.assign(draft, patch)
          })
        )
        
        try {
          // 2. 等待请求完成
          await queryFulfilled
          // 3. 请求成功，保持更新
        } catch {
          // 4. 请求失败，回滚更新
          patchResult.undo()
        }
      },
    }),
    
    // 删除文章（带乐观更新）
    deletePost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'DELETE',
      }),
      
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // 1. 从列表中移除文章
        const patchResult = dispatch(
          postsApi.util.updateQueryData('getPosts', undefined, (draft) => {
            // 过滤掉被删除的文章
            return draft.filter(post => post.id !== id)
          })
        )
        
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),
    
    // 创建文章（带乐观更新）
    createPost: builder.mutation({
      query: (newPost) => ({
        url: '/posts',
        method: 'POST',
        body: newPost,
      }),
      
      async onQueryStarted(newPost, { dispatch, queryFulfilled }) {
        // 1. 立即添加到列表（使用临时 ID）
        const patchResult = dispatch(
          postsApi.util.updateQueryData('getPosts', undefined, (draft) => {
            draft.unshift({
              ...newPost,
              id: 'temp-' + Date.now(),  // 临时 ID
            })
          })
        )
        
        try {
          // 2. 等待服务器返回真实 ID
          const { data: createdPost } = await queryFulfilled
          
          // 3. 用真实数据替换临时数据
          dispatch(
            postsApi.util.updateQueryData('getPosts', undefined, (draft) => {
              const index = draft.findIndex(post => post.id.toString().startsWith('temp-'))
              if (index !== -1) {
                draft[index] = createdPost
              }
            })
          )
        } catch {
          patchResult.undo()
        }
      },
    }),
  }),
})

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useUpdatePostMutation,
  useDeletePostMutation,
  useCreatePostMutation,
} = postsApi

// ==================== 3. 实战示例：点赞功能 ====================

export const socialApi = createApi({
  reducerPath: 'socialApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.example.com' }),
  tagTypes: ['Post'],
  
  endpoints: (builder) => ({
    getPost: builder.query({
      query: (id) => `/posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    
    // 点赞文章
    likePost: builder.mutation({
      query: (postId) => ({
        url: `/posts/${postId}/like`,
        method: 'POST',
      }),
      
      async onQueryStarted(postId, { dispatch, queryFulfilled }) {
        // 1. 立即增加点赞数
        const patchResult = dispatch(
          socialApi.util.updateQueryData('getPost', postId, (draft) => {
            draft.likes += 1
            draft.isLiked = true
          })
        )
        
        try {
          await queryFulfilled
        } catch {
          // 失败时回滚
          patchResult.undo()
          alert('点赞失败，请重试')
        }
      },
    }),
    
    // 取消点赞
    unlikePost: builder.mutation({
      query: (postId) => ({
        url: `/posts/${postId}/unlike`,
        method: 'POST',
      }),
      
      async onQueryStarted(postId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          socialApi.util.updateQueryData('getPost', postId, (draft) => {
            draft.likes -= 1
            draft.isLiked = false
          })
        )
        
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),
  }),
})

// 点赞按钮组件
function LikeButton({ postId }) {
  const { data: post } = socialApi.endpoints.getPost.useQuery(postId)
  const [likePost] = socialApi.endpoints.likePost.useMutation()
  const [unlikePost] = socialApi.endpoints.unlikePost.useMutation()
  
  const handleToggleLike = () => {
    if (post?.isLiked) {
      unlikePost(postId)
    } else {
      likePost(postId)
    }
  }
  
  return (
    <button onClick={handleToggleLike}>
      {post?.isLiked ? '❤️' : '🤍'} {post?.likes || 0}
    </button>
  )
}

// ==================== 4. 更新多个查询 ====================

/**
 * 场景：更新文章标题时，同时更新列表和详情
 */

export const multiUpdateApi = createApi({
  reducerPath: 'multiUpdateApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.example.com' }),
  tagTypes: ['Post'],
  
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: () => '/posts',
    }),
    
    getPostById: builder.query({
      query: (id) => `/posts/${id}`,
    }),
    
    updatePost: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        // 1. 更新详情页缓存
        const patchDetail = dispatch(
          multiUpdateApi.util.updateQueryData('getPostById', id, (draft) => {
            Object.assign(draft, patch)
          })
        )
        
        // 2. 更新列表页缓存
        const patchList = dispatch(
          multiUpdateApi.util.updateQueryData('getPosts', undefined, (draft) => {
            const post = draft.find(p => p.id === id)
            if (post) {
              Object.assign(post, patch)
            }
          })
        )
        
        try {
          await queryFulfilled
        } catch {
          // 回滚所有更新
          patchDetail.undo()
          patchList.undo()
        }
      },
    }),
  }),
})

// ==================== 5. Web3 实战：发送交易 ====================

/**
 * 场景：发送 ETH 交易时，立即扣除余额
 */

export const walletApi = createApi({
  reducerPath: 'walletApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.example.com' }),
  tagTypes: ['Balance', 'Transaction'],
  
  endpoints: (builder) => ({
    // 获取余额
    getBalance: builder.query({
      query: ({ address, chainId }) => ({
        url: `/balance/${address}`,
        params: { chainId },
      }),
      providesTags: (result, error, { address }) => [
        { type: 'Balance', id: address }
      ],
    }),
    
    // 获取交易列表
    getTransactions: builder.query({
      query: ({ address, chainId }) => ({
        url: `/transactions/${address}`,
        params: { chainId },
      }),
      providesTags: ['Transaction'],
    }),
    
    // 发送交易
    sendTransaction: builder.mutation({
      query: (txData) => ({
        url: '/transaction/send',
        method: 'POST',
        body: txData,
      }),
      
      async onQueryStarted(txData, { dispatch, queryFulfilled }) {
        const { from, value, gasLimit, gasPrice, chainId } = txData
        
        // 1. 立即扣除余额（value + gas 费）
        const totalCost = BigInt(value) + BigInt(gasLimit) * BigInt(gasPrice)
        
        const patchBalance = dispatch(
          walletApi.util.updateQueryData(
            'getBalance',
            { address: from, chainId },
            (draft) => {
              draft.amount = (BigInt(draft.amount) - totalCost).toString()
            }
          )
        )
        
        // 2. 立即添加待确认交易到列表
        const patchTransactions = dispatch(
          walletApi.util.updateQueryData(
            'getTransactions',
            { address: from, chainId },
            (draft) => {
              draft.transactions.unshift({
                hash: 'pending-' + Date.now(),
                from,
                to: txData.to,
                value,
                status: 'pending',
                timestamp: Date.now(),
              })
            }
          )
        )
        
        try {
          // 3. 等待交易确认
          const { data: result } = await queryFulfilled
          
          // 4. 用真实交易哈希替换临时哈希
          dispatch(
            walletApi.util.updateQueryData(
              'getTransactions',
              { address: from, chainId },
              (draft) => {
                const index = draft.transactions.findIndex(
                  tx => tx.hash.startsWith('pending-')
                )
                if (index !== -1) {
                  draft.transactions[index] = {
                    ...result.transaction,
                    status: 'confirmed',
                  }
                }
              }
            )
          )
        } catch (error) {
          // 5. 失败时回滚
          patchBalance.undo()
          patchTransactions.undo()
          alert('交易失败: ' + error.message)
        }
      },
    }),
  }),
})

// 发送交易组件
function SendTransactionOptimistic({ fromAddress, chainId }) {
  const { data: balance } = walletApi.endpoints.getBalance.useQuery({
    address: fromAddress,
    chainId,
  })
  
  const [sendTx, { isLoading }] = walletApi.endpoints.sendTransaction.useMutation()
  
  const handleSend = async () => {
    await sendTx({
      from: fromAddress,
      to: '0x...',
      value: '1000000000000000000',
      chainId,
      gasLimit: 21000,
      gasPrice: '20000000000',
    })
    // 余额会立即更新，不需要等待交易确认
  }
  
  return (
    <div>
      <p>余额: {balance?.amount} Wei</p>
      <button onClick={handleSend} disabled={isLoading}>
        发送交易
      </button>
    </div>
  )
}

// ==================== 6. 高级技巧 ====================

/**
 * 技巧 1: 获取其他查询的缓存数据
 */

export const advancedApi = createApi({
  reducerPath: 'advancedApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.example.com' }),
  
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (id) => `/users/${id}`,
    }),
    
    updateUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled, getState }) {
        // 获取当前缓存的用户数据
        const state = getState()
        const cachedUser = advancedApi.endpoints.getUser.select(id)(state)
        
        console.log('当前缓存的用户:', cachedUser.data)
        
        // 基于当前数据进行更新
        const patchResult = dispatch(
          advancedApi.util.updateQueryData('getUser', id, (draft) => {
            Object.assign(draft, patch)
          })
        )
        
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),
  }),
})

/**
 * 技巧 2: 条件乐观更新
 */

export const conditionalApi = createApi({
  reducerPath: 'conditionalApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.example.com' }),
  
  endpoints: (builder) => ({
    updatePost: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      
      async onQueryStarted({ id, optimistic = true, ...patch }, { dispatch, queryFulfilled }) {
        let patchResult
        
        // 只有在 optimistic 为 true 时才进行乐观更新
        if (optimistic) {
          patchResult = dispatch(
            conditionalApi.util.updateQueryData('getPost', id, (draft) => {
              Object.assign(draft, patch)
            })
          )
        }
        
        try {
          await queryFulfilled
        } catch {
          if (patchResult) {
            patchResult.undo()
          }
        }
      },
    }),
  }),
})

// ==================== 7. 调试技巧 ====================

/**
 * 添加日志以调试乐观更新
 */

export const debugApi = createApi({
  reducerPath: 'debugApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.example.com' }),
  
  endpoints: (builder) => ({
    updatePost: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        console.log('🚀 开始乐观更新:', { id, patch })
        
        const patchResult = dispatch(
          debugApi.util.updateQueryData('getPost', id, (draft) => {
            console.log('📝 更新前:', { ...draft })
            Object.assign(draft, patch)
            console.log('✅ 更新后:', { ...draft })
          })
        )
        
        try {
          const result = await queryFulfilled
          console.log('✅ 请求成功:', result.data)
        } catch (error) {
          console.log('❌ 请求失败，回滚:', error)
          patchResult.undo()
        }
      },
    }),
  }),
})

export {
  LikeButton,
  SendTransactionOptimistic,
}

/**
 * 总结：
 * 
 * 1. 乐观更新提升用户体验，适合高成功率的操作
 * 2. 使用 onQueryStarted 钩子实现乐观更新
 * 3. 使用 updateQueryData 更新缓存
 * 4. 使用 patchResult.undo() 在失败时回滚
 * 5. 可以同时更新多个查询的缓存
 * 6. Web3 场景中特别适合余额和交易状态的即时更新
 * 7. 添加日志帮助调试乐观更新流程
 */
