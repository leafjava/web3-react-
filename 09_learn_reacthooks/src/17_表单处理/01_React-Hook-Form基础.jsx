/**
 * React Hook Form 基础示例
 * 
 * React Hook Form 是现代 React 表单处理的最佳实践
 * 相比传统受控组件，性能更好、代码更简洁
 * 
 * 安装：npm install react-hook-form
 */

import React from 'react'
// import { useForm } from 'react-hook-form'

/**
 * 示例 1: 基础用法
 */
function BasicForm() {
  // 如果安装了 react-hook-form，取消注释下面的代码
  /*
  const {
    register,     // 注册输入字段
    handleSubmit, // 处理表单提交
    formState: { errors, isSubmitting }, // 表单状态
    reset,        // 重置表单
  } = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
    }
  })

  const onSubmit = async (data) => {
    console.log('表单数据:', data)
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('提交成功！')
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>用户名:</label>
        <input
          {...register('username', {
            required: '用户名不能为空',
            minLength: { value: 3, message: '用户名至少 3 个字符' }
          })}
        />
        {errors.username && <span>{errors.username.message}</span>}
      </div>

      <div>
        <label>邮箱:</label>
        <input
          type="email"
          {...register('email', {
            required: '邮箱不能为空',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: '邮箱格式不正确'
            }
          })}
        />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <label>密码:</label>
        <input
          type="password"
          {...register('password', {
            required: '密码不能为空',
            minLength: { value: 6, message: '密码至少 6 个字符' }
          })}
        />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '提交中...' : '提交'}
      </button>
    </form>
  )
  */

  // 未安装 react-hook-form 时的占位内容
  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
      <h3>React Hook Form 基础示例</h3>
      <p>请先安装依赖：</p>
      <pre style={{ background: '#333', color: '#fff', padding: '10px', borderRadius: '4px' }}>
        npm install react-hook-form
      </pre>
      <p>然后取消注释代码即可运行</p>
    </div>
  )
}

/**
 * 示例 2: 与传统受控组件对比
 */

// 传统受控组件（CoderWhy 课程方式）
function TraditionalForm() {
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = React.useState({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.username) {
      newErrors.username = '用户名不能为空'
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少 3 个字符'
    }
    
    if (!formData.email) {
      newErrors.email = '邮箱不能为空'
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = '邮箱格式不正确'
    }
    
    if (!formData.password) {
      newErrors.password = '密码不能为空'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少 6 个字符'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsSubmitting(true)
    
    try {
      console.log('表单数据:', formData)
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('提交成功！')
      setFormData({ username: '', email: '', password: '' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
      <h3>传统受控组件方式</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label>用户名:</label>
        <input
          name="username"
          value={formData.username}
          onChange={handleChange}
          style={{ marginLeft: '10px', padding: '5px' }}
        />
        {errors.username && (
          <span style={{ color: 'red', marginLeft: '10px' }}>{errors.username}</span>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>邮箱:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          style={{ marginLeft: '10px', padding: '5px' }}
        />
        {errors.email && (
          <span style={{ color: 'red', marginLeft: '10px' }}>{errors.email}</span>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>密码:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          style={{ marginLeft: '10px', padding: '5px' }}
        />
        {errors.password && (
          <span style={{ color: 'red', marginLeft: '10px' }}>{errors.password}</span>
        )}
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        style={{ padding: '8px 20px', cursor: 'pointer' }}
      >
        {isSubmitting ? '提交中...' : '提交'}
      </button>
    </form>
  )
}

/**
 * 对比总结：
 * 
 * 传统受控组件（CoderWhy 课程）：
 * ✅ 概念简单，容易理解
 * ✅ 完全控制表单状态
 * ❌ 代码冗长，需要手写很多逻辑
 * ❌ 每次输入都触发重新渲染（性能问题）
 * ❌ 验证逻辑需要手写
 * 
 * React Hook Form：
 * ✅ 代码简洁，自动处理大部分逻辑
 * ✅ 性能优秀，使用非受控组件 + ref
 * ✅ 内置验证规则
 * ✅ 与 Zod/Yup 等验证库集成
 * ❌ 需要学习新的 API
 */

function App() {
  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>React 表单处理对比</h1>
      
      <BasicForm />
      
      <hr style={{ margin: '40px 0' }} />
      
      <TraditionalForm />
      
      <div style={{ marginTop: '40px', padding: '20px', background: '#e3f2fd', borderRadius: '8px' }}>
        <h3>💡 学习建议</h3>
        <ul>
          <li>先掌握传统受控组件（CoderWhy 课程内容）</li>
          <li>理解表单状态管理的原理</li>
          <li>再学习 React Hook Form 提升效率</li>
          <li>大型项目推荐使用 React Hook Form + Zod</li>
        </ul>
      </div>
    </div>
  )
}

export default App
