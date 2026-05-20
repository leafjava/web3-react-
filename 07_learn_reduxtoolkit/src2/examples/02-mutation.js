/**
 * 示例 2: Mutation（数据修改）
 * 
 * 学习目标：
 * 1. 理解 Mutation 与 Query 的区别
 * 2. 掌握 useMutation Hook 的使用
 * 3. 学习如何处理表单提交和数据更新
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// ==================== 1. 创建包含 Mutation 的 API ====================

export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
  tagTypes: ['Post'],
  
  endpoints: (builder) => ({
    // Query: 获取数据
    getPosts: builder.query({
      query: () => '/posts',
      providesTags: ['Post'],
    }),
    
    getPostById: builder.query({
      query: (id) => `/posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    
    // Mutation: 创建数据
    createPost: builder.mutation({
      query: (newPost) => ({
        url: '/posts',
        method: 'POST',
        body: newPost,
      }),
      // 创建成功后，使所有 Post 列表失效，触发重新获取
      invalidatesTags: ['Post'],
    }),
    
    // Mutation: 更新数据
    updatePost: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      // 只使特定 ID 的 Post 失效
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
    }),
    
    // Mutation: 删除数据
    deletePost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
  }),
})

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = postsApi

// ==================== 2. 基础 Mutation 使用 ====================

/**
 * 示例 2.1: 创建文章
 */
function CreatePostForm() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  
  // 使用 Mutation Hook
  const [createPost, { isLoading, isSuccess, isError, error }] = useCreatePostMutation()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // 方式 1: 使用 unwrap() 获取 Promise
      const result = await createPost({ title, body, userId: 1 }).unwrap()
      console.log('创建成功:', result)
      
      // 清空表单
      setTitle('')
      setBody('')
      
      alert('文章创建成功！')
    } catch (err) {
      console.error('创建失败:', err)
      alert('创建失败: ' + err.message)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题"
        required
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="内容"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? '创建中...' : '创建文章'}
      </button>
      
      {isSuccess && <p>✅ 创建成功</p>}
      {isError && <p>❌ 创建失败: {error.message}</p>}
    </form>
  )
}

/**
 * 示例 2.2: 更新文章
 */
function EditPostForm({ postId }) {
  const { data: post } = useGetPostByIdQuery(postId)
  const [title, setTitle] = useState(post?.title || '')
  const [updatePost, { isLoading }] = useUpdatePostMutation()
  
  useEffect(() => {
    if (post) {
      setTitle(post.title)
    }
  }, [post])
  
  const handleUpdate = async () => {
    try {
      await updatePost({ id: postId, title }).unwrap()
      alert('更新成功！')
    } catch (err) {
      alert('更新失败: ' + err.message)
    }
  }
  
  return (
    <div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button onClick={handleUpdate} disabled={isLoading}>
        {isLoading ? '更新中...' : '更新'}
      </button>
    </div>
  )
}

/**
 * 示例 2.3: 删除文章
 */
function DeletePostButton({ postId }) {
  const [deletePost, { isLoading }] = useDeletePostMutation()
  
  const handleDelete = async () => {
    if (!confirm('确定要删除吗？')) return
    
    try {
      await deletePost(postId).unwrap()
      alert('删除成功！')
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }
  
  return (
    <button onClick={handleDelete} disabled={isLoading}>
      {isLoading ? '删除中...' : '删除'}
    </button>
  )
}

// ==================== 3. Mutation 状态详解 ====================

/**
 * useMutation Hook 返回值：
 * 
 * [trigger, result] = useMutation()
 * 
 * trigger: 触发函数
 *   - 调用后返回 Promise
 *   - 可以使用 .unwrap() 获取原始 Promise
 * 
 * result: 结果对象
 *   {
 *     data,           // 成功时的返回数据
 *     error,          // 失败时的错误对象
 *     isLoading,      // 请求进行中
 *     isSuccess,      // 请求成功
 *     isError,        // 请求失败
 *     isUninitialized,// 尚未调用
 *     reset,          // 重置状态函数
 *   }
 */

function MutationStatesExample() {
  const [createPost, result] = useCreatePostMutation()
  
  const {
    data,
    error,
    isLoading,
    isSuccess,
    isError,
    isUninitialized,
    reset,
  } = result
  
  const handleCreate = () => {
    createPost({ title: 'Test', body: 'Test body', userId: 1 })
  }
  
  return (
    <div>
      <button onClick={handleCreate}>创建</button>
      <button onClick={reset}>重置状态</button>
      
      <div>
        <p>未初始化: {isUninitialized ? '是' : '否'}</p>
        <p>加载中: {isLoading ? '是' : '否'}</p>
        <p>成功: {isSuccess ? '是' : '否'}</p>
        <p>失败: {isError ? '是' : '否'}</p>
        {data && <p>返回数据: {JSON.stringify(data)}</p>}
        {error && <p>错误: {error.message}</p>}
      </div>
    </div>
  )
}

// ==================== 4. unwrap() 详解 ====================

/**
 * unwrap() 的作用：
 * 将 RTK Query 的 Promise 转换为标准 Promise
 * 
 * 不使用 unwrap():
 * - 返回 { data, error } 对象
 * - 不会抛出错误
 * 
 * 使用 unwrap():
 * - 直接返回 data
 * - 失败时抛出错误（可以用 try/catch 捕获）
 */

function UnwrapExample() {
  const [createPost] = useCreatePostMutation()
  
  // 方式 1: 不使用 unwrap()
  const handleCreate1 = async () => {
    const result = await createPost({ title: 'Test', body: 'Test', userId: 1 })
    
    if (result.data) {
      console.log('成功:', result.data)
    } else if (result.error) {
      console.error('失败:', result.error)
    }
  }
  
  // 方式 2: 使用 unwrap()（推荐）
  const handleCreate2 = async () => {
    try {
      const data = await createPost({ title: 'Test', body: 'Test', userId: 1 }).unwrap()
      console.log('成功:', data)
    } catch (error) {
      console.error('失败:', error)
    }
  }
  
  return (
    <div>
      <button onClick={handleCreate1}>方式 1</button>
      <button onClick={handleCreate2}>方式 2（推荐）</button>
    </div>
  )
}

// ==================== 5. 固定缓存行为 ====================

/**
 * Mutation 的 fixedCacheKey 选项：
 * 多次调用同一个 Mutation 时共享状态
 */

function FixedCacheKeyExample() {
  // 两个按钮共享同一个 Mutation 状态
  const [createPost, { isLoading }] = useCreatePostMutation({
    fixedCacheKey: 'shared-create-post',
  })
  
  return (
    <div>
      <button onClick={() => createPost({ title: 'A', body: 'A', userId: 1 })}>
        创建 A
      </button>
      <button onClick={() => createPost({ title: 'B', body: 'B', userId: 1 })}>
        创建 B
      </button>
      {isLoading && <p>创建中...</p>}
    </div>
  )
}

// ==================== 6. 实战场景 ====================

/**
 * 场景 1: 表单提交后重置
 */
function FormWithReset() {
  const [title, setTitle] = useState('')
  const [createPost, { isLoading, isSuccess, reset }] = useCreatePostMutation()
  
  useEffect(() => {
    if (isSuccess) {
      // 成功后清空表单和重置状态
      setTitle('')
      setTimeout(reset, 2000)  // 2 秒后重置成功提示
    }
  }, [isSuccess, reset])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    await createPost({ title, body: '', userId: 1 })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <button type="submit" disabled={isLoading}>提交</button>
      {isSuccess && <p>✅ 提交成功</p>}
    </form>
  )
}

/**
 * 场景 2: 批量操作
 */
function BatchDelete({ postIds }) {
  const [deletePost] = useDeletePostMutation()
  const [progress, setProgress] = useState(0)
  
  const handleBatchDelete = async () => {
    for (let i = 0; i < postIds.length; i++) {
      try {
        await deletePost(postIds[i]).unwrap()
        setProgress(((i + 1) / postIds.length) * 100)
      } catch (err) {
        console.error(`删除 ${postIds[i]} 失败:`, err)
      }
    }
    alert('批量删除完成！')
  }
  
  return (
    <div>
      <button onClick={handleBatchDelete}>批量删除</button>
      <progress value={progress} max="100" />
    </div>
  )
}

/**
 * 场景 3: 乐观更新（在下一个示例文件中详细讲解）
 */

// ==================== 7. Query vs Mutation 对比 ====================

/**
 * Query:
 * - 用于获取数据（GET）
 * - 自动缓存
 * - 可以自动重新获取（轮询、焦点、重连）
 * - 多个组件可以共享同一个查询
 * 
 * Mutation:
 * - 用于修改数据（POST、PUT、PATCH、DELETE）
 * - 不自动缓存
 * - 需要手动触发
 * - 可以使缓存失效，触发相关查询重新获取
 */

export {
  CreatePostForm,
  EditPostForm,
  DeletePostButton,
  MutationStatesExample,
  UnwrapExample,
  FixedCacheKeyExample,
  FormWithReset,
  BatchDelete,
}
