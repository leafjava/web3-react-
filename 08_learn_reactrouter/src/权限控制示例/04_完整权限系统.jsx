/**
 * React 完整权限控制系统
 * 
 * 整合：
 * 1. 路由守卫（页面级权限）
 * 2. 动态路由（根据权限生成路由和菜单）
 * 3. 按钮级权限（细粒度控制）
 * 4. Context 状态管理
 * 
 * 这是一个生产级的完整示例
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'

// ==================== 权限 Context ====================

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  hasPermission: () => false,
  hasRole: () => false
})

/**
 * 权限 Provider
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 初始化：从 localStorage 恢复用户信息
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userInfo = localStorage.getItem('userInfo')
    
    if (token && userInfo) {
      setUser(JSON.parse(userInfo))
    }
    setLoading(false)
  }, [])

  // 登录
  const login = async (username, password) => {
    // 模拟 API 调用
    const mockUsers = {
      admin: {
        id: 1,
        username: 'admin',
        nickname: '管理员',
        role: 'admin',
        permissions: [
          'user:list', 'user:add', 'user:edit', 'user:delete',
          'order:list', 'order:detail', 'order:export',
          'system:config'
        ]
      },
      user: {
        id: 2,
        username: 'user',
        nickname: '普通用户',
        role: 'user',
        permissions: ['user:list', 'user:add', 'order:list']
      },
      guest: {
        id: 3,
        username: 'guest',
        nickname: '访客',
        role: 'guest',
        permissions: ['user:list']
      }
    }

    const userInfo = mockUsers[username]
    if (userInfo && password === '123456') {
      const token = `mock-token-${Date.now()}`
      localStorage.setItem('token', token)
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      setUser(userInfo)
      return { success: true, user: userInfo }
    }

    return { success: false, message: '用户名或密码错误' }
  }

  // 退出登录
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    setUser(null)
  }

  // 检查权限
  const hasPermission = (permission) => {
    if (!user) return false
    if (!permission) return true
    
    if (Array.isArray(permission)) {
      return permission.every(p => user.permissions.includes(p))
    }
    
    return user.permissions.includes(permission)
  }

  // 检查角色
  const hasRole = (role) => {
    if (!user) return false
    if (Array.isArray(role)) {
      return role.includes(user.role)
    }
    return user.role === role
  }

  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    hasRole
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * 使用权限的 Hook
 */
export function useAuth() {
  return useContext(AuthContext)
}

// ==================== 路由配置 ====================

const routeConfig = [
  {
    path: '/',
    element: <Layout />,
    meta: { requiresAuth: true },
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
        meta: {
          title: '工作台',
          icon: '📊'
        }
      },
      {
        path: 'user',
        meta: {
          title: '用户管理',
          icon: '👥',
          permissions: ['user:list']
        },
        children: [
          {
            path: 'list',
            element: <UserListPage />,
            meta: {
              title: '用户列表',
              permissions: ['user:list']
            }
          },
          {
            path: 'add',
            element: <UserAddPage />,
            meta: {
              title: '添加用户',
              permissions: ['user:add']
            }
          }
        ]
      },
      {
        path: 'order',
        meta: {
          title: '订单管理',
          icon: '📦',
          permissions: ['order:list']
        },
        children: [
          {
            path: 'list',
            element: <OrderListPage />,
            meta: {
              title: '订单列表',
              permissions: ['order:list']
            }
          }
        ]
      },
      {
        path: 'system',
        element: <SystemPage />,
        meta: {
          title: '系统设置',
          icon: '⚙️',
          roles: ['admin']
        }
      }
    ]
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/403',
    element: <ForbiddenPage />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]

// ==================== 路由守卫组件 ====================

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div>加载中...</div>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function RequirePermission({ permission, children }) {
  const { hasPermission } = useAuth()

  if (!hasPermission(permission)) {
    return <Navigate to="/403" replace />
  }

  return children
}

function RequireRole({ role, children }) {
  const { hasRole } = useAuth()

  if (!hasRole(role)) {
    return <Navigate to="/403" replace />
  }

  return children
}

// ==================== 权限组件 ====================

function Permission({ permission, fallback = null, children }) {
  const { hasPermission } = useAuth()

  if (!hasPermission(permission)) {
    return fallback
  }

  return children
}

function PermissionButton({ permission, children, ...props }) {
  const { hasPermission } = useAuth()

  if (!hasPermission(permission)) {
    return null
  }

  return <button {...props}>{children}</button>
}

// ==================== 布局组件 ====================

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <header className="header">
        <h1>权限管理系统</h1>
        <div className="user-info">
          <span>欢迎，{user?.nickname}</span>
          <span>角色：{user?.role}</span>
          <button onClick={handleLogout}>退出</button>
        </div>
      </header>

      <div className="main">
        <aside className="sidebar">
          <Menu />
        </aside>
        
        <main className="content">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            <Route path="user">
              <Route 
                path="list" 
                element={
                  <RequirePermission permission="user:list">
                    <UserListPage />
                  </RequirePermission>
                } 
              />
              <Route 
                path="add" 
                element={
                  <RequirePermission permission="user:add">
                    <UserAddPage />
                  </RequirePermission>
                } 
              />
            </Route>

            <Route path="order">
              <Route 
                path="list" 
                element={
                  <RequirePermission permission="order:list">
                    <OrderListPage />
                  </RequirePermission>
                } 
              />
            </Route>

            <Route 
              path="system" 
              element={
                <RequireRole role="admin">
                  <SystemPage />
                </RequireRole>
              } 
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// ==================== 菜单组件 ====================

function Menu() {
  const { hasPermission, hasRole } = useAuth()

  const menuItems = [
    { path: '/dashboard', title: '工作台', icon: '📊' },
    { 
      path: '/user', 
      title: '用户管理', 
      icon: '👥',
      permission: 'user:list',
      children: [
        { path: '/user/list', title: '用户列表', permission: 'user:list' },
        { path: '/user/add', title: '添加用户', permission: 'user:add' }
      ]
    },
    { 
      path: '/order', 
      title: '订单管理', 
      icon: '📦',
      permission: 'order:list',
      children: [
        { path: '/order/list', title: '订单列表', permission: 'order:list' }
      ]
    },
    { path: '/system', title: '系统设置', icon: '⚙️', role: 'admin' }
  ]

  const filterMenu = (items) => {
    return items.filter(item => {
      if (item.permission && !hasPermission(item.permission)) return false
      if (item.role && !hasRole(item.role)) return false
      if (item.children) {
        item.children = filterMenu(item.children)
      }
      return true
    })
  }

  const filteredMenu = filterMenu(menuItems)

  return (
    <nav className="menu">
      {filteredMenu.map(item => (
        <MenuItem key={item.path} item={item} />
      ))}
    </nav>
  )
}

function MenuItem({ item }) {
  return (
    <div className="menu-item">
      {item.children ? (
        <div>
          <div className="menu-title">
            {item.icon} {item.title}
          </div>
          <div className="menu-children">
            {item.children.map(child => (
              <Link key={child.path} to={child.path} className="menu-link">
                {child.title}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <Link to={item.path} className="menu-link">
          {item.icon} {item.title}
        </Link>
      )}
    </div>
  )
}

// ==================== 页面组件 ====================

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(username, password)
    
    if (result.success) {
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } else {
      alert(result.message)
    }
  }

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>登录</h2>
        <input
          type="text"
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">登录</button>
        
        <div className="tips">
          <p>测试账号：</p>
          <p>admin / 123456（管理员）</p>
          <p>user / 123456（普通用户）</p>
          <p>guest / 123456（访客）</p>
        </div>
      </form>
    </div>
  )
}

function DashboardPage() {
  const { user } = useAuth()
  
  return (
    <div>
      <h2>工作台</h2>
      <p>欢迎，{user?.nickname}！</p>
      <p>您的角色：{user?.role}</p>
      <p>您的权限：{user?.permissions.join(', ')}</p>
    </div>
  )
}

function UserListPage() {
  const users = [
    { id: 1, name: '张三', role: 'admin' },
    { id: 2, name: '李四', role: 'user' },
    { id: 3, name: '王五', role: 'guest' }
  ]

  return (
    <div>
      <h2>用户列表</h2>
      
      <div className="toolbar">
        <PermissionButton permission="user:add">
          ➕ 添加用户
        </PermissionButton>
        
        <Permission permission="user:export">
          <button>📥 导出</button>
        </Permission>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>角色</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.role}</td>
              <td>
                <Permission permission="user:edit">
                  <button>编辑</button>
                </Permission>
                
                <Permission permission="user:delete">
                  <button>删除</button>
                </Permission>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UserAddPage() {
  return (
    <div>
      <h2>添加用户</h2>
      <form>
        <input type="text" placeholder="用户名" />
        <input type="email" placeholder="邮箱" />
        <button type="submit">提交</button>
      </form>
    </div>
  )
}

function OrderListPage() {
  return (
    <div>
      <h2>订单列表</h2>
      <Permission permission="order:export">
        <button>导出订单</button>
      </Permission>
    </div>
  )
}

function SystemPage() {
  return (
    <div>
      <h2>系统设置</h2>
      <p>只有管理员可以访问此页面</p>
    </div>
  )
}

function ForbiddenPage() {
  return (
    <div>
      <h2>403 - 无权限访问</h2>
      <Link to="/">返回首页</Link>
    </div>
  )
}

function NotFoundPage() {
  return (
    <div>
      <h2>404 - 页面不存在</h2>
      <Link to="/">返回首页</Link>
    </div>
  )
}

// ==================== 主应用 ====================

export function CompleteAuthApp() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route 
            path="/*" 
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

/**
 * 完整权限系统架构：
 * 
 * 1. 权限层级
 *    ├── 页面级：路由守卫（RequireAuth, RequirePermission, RequireRole）
 *    ├── 模块级：菜单过滤（根据权限显示/隐藏菜单）
 *    └── 按钮级：权限组件（Permission, PermissionButton）
 * 
 * 2. 状态管理
 *    - AuthContext 管理用户信息和权限
 *    - localStorage 持久化登录状态
 *    - useAuth Hook 访问权限信息
 * 
 * 3. 权限判断
 *    - hasPermission: 检查权限码
 *    - hasRole: 检查角色
 *    - 支持单个或数组形式
 * 
 * 4. 安全性
 *    - 前端权限只是 UI 控制
 *    - 后端必须验证所有请求
 *    - Token 过期处理
 *    - 敏感操作二次确认
 */
