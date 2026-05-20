/**
 * React Router v6 权限控制 - 基础方案
 * 
 * 对应 Vue Router 的路由守卫：
 * Vue: beforeEach((to, from, next) => { ... })
 * React: 使用高阶组件 + <Navigate> 实现
 * 
 * 对应课程：08_learn_reactrouter
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

// ==================== 模拟用户权限数据 ====================

// 模拟从后端获取的用户信息
const mockUserInfo = {
  id: 1,
  username: 'admin',
  role: 'admin', // admin, user, guest
  permissions: ['user:list', 'user:add', 'user:edit', 'user:delete', 'order:list', 'order:export']
}

// 模拟 localStorage 存储的 token
const getToken = () => {
  return localStorage.getItem('token')
}

const setToken = (token) => {
  localStorage.setItem('token', token)
}

const removeToken = () => {
  localStorage.removeItem('token')
}

// ==================== 路由守卫组件（类似 Vue 的 beforeEach）====================

/**
 * 路由守卫 - 基础版本
 * 功能：检查用户是否登录
 */
export function AuthGuard({ children }) {
  const token = getToken()
  const location = useLocation()

  // 如果没有 token，重定向到登录页
  if (!token) {
    // 保存当前路径，登录后可以跳转回来
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 已登录，渲染子组件
  return children
}

/**
 * 路由守卫 - 角色权限版本
 * 功能：检查用户角色是否有权限访问
 */
export function RoleGuard({ children, allowedRoles = [] }) {
  const token = getToken()
  const location = useLocation()
  const userRole = mockUserInfo.role // 实际项目中从 Context 或 Redux 获取

  // 1. 检查是否登录
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 2. 检查角色权限
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // 无权限，跳转到 403 页面
    return <Navigate to="/403" replace />
  }

  // 有权限，渲染子组件
  return children
}

/**
 * 路由守卫 - 权限码版本（最细粒度）
 * 功能：检查用户是否有特定权限码
 */
export function PermissionGuard({ children, requiredPermission }) {
  const token = getToken()
  const location = useLocation()
  const userPermissions = mockUserInfo.permissions // 实际项目中从 Context 或 Redux 获取

  // 1. 检查是否登录
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 2. 检查权限码
  if (requiredPermission && !userPermissions.includes(requiredPermission)) {
    return <Navigate to="/403" replace />
  }

  return children
}

// ==================== 使用示例 ====================

/**
 * 在路由配置中使用
 */
export const routeConfigExample = [
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/home',
    element: (
      <AuthGuard></AuthGuard>ome />
      </AuthGuard>
    )
  },
  {
    path: '/admin',
    element: (
      <RoleGuard allowedRoles={['admin']}>
        <AdminPage />
      </RoleGuard>
    )
  },
  {
    path: '/user/add',
    element: (
      <PermissionGuard requiredPermission="user:add">
        <UserAddPage />
      </PermissionGuard>
    )
  }
]

// ==================== 页面组件示例 ====================

function Login() {
  const handleLogin = () => {
    // 模拟登录
    setToken('mock-token-123456')
    alert('登录成功！')
  }

  return (
    <div>
      <h2>登录页</h2>
      <button onClick={handleLogin}>登录</button>
    </div>
  )
}

function Home() {
  return <div><h2>首页（需要登录）</h2></div>
}

function AdminPage() {
  return <div><h2>管理员页面（需要 admin 角色）</h2></div>
}

function UserAddPage() {
  return <div><h2>添加用户页面（需要 user:add 权限）</h2></div>
}

/**
 * 知识点总结：
 * 
 * 1. Vue vs React 路由守卫对比
 * 
 * Vue Router:
 * router.beforeEach((to, from, next) => {
 *   if (to.meta.requiresAuth && !token) {
 *     next('/login')
 *   } else {
 *     next()
 *   }
 * })
 * 
 * React Router v6:
 * <Route path="/home" element={
 *   <AuthGuard>
 *     <Home />
 *   </AuthGuard>
 * } />
 * 
 * 2. 三种权限级别
 *    - AuthGuard: 只检查是否登录
 *    - RoleGuard: 检查用户角色（admin, user, guest）
 *    - PermissionGuard: 检查具体权限码（user:add, order:delete）
 * 
 * 3. Navigate 组件
 *    - replace: 替换历史记录，不能后退
 *    - state: 传递状态，登录后可以跳转回原页面
 * 
 * 4. 实际项目中的改进
 *    - 用户信息应该从 Context 或 Redux 获取
 *    - 权限数据应该从后端 API 获取
 *    - 可以添加 loading 状态
 */
