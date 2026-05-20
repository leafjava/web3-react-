/**
 * React Router v6 权限控制 - 动态路由
 * 
 * 对应 Vue Router 的动态路由：
 * Vue: router.addRoute() 动态添加路由
 * React: 根据权限过滤路由配置
 * 
 * 核心思路：
 * 1. 定义完整的路由配置（包含权限信息）
 * 2. 根据用户权限过滤可访问的路由
 * 3. 动态生成菜单和路由
 */

import React, { useState, useEffect } from 'react'
import { useRoutes, Navigate, Link } from 'react-router-dom'

// ==================== 路由配置（包含权限信息）====================

/**
 * 路由元信息
 * - title: 菜单标题
 * - icon: 菜单图标
 * - requiresAuth: 是否需要登录
 * - roles: 允许访问的角色
 * - permissions: 需要的权限码
 * - hidden: 是否在菜单中隐藏
 */
const routeConfig = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '',
        element: <Navigate to="/home" replace />
      },
      {
        path: 'home',
        element: <HomePage />,
        meta: {
          title: '首页',
          icon: '🏠',
          requiresAuth: true
        }
      },
      {
        path: 'user',
        meta: {
          title: '用户管理',
          icon: '👥',
          requiresAuth: true,
          roles: ['admin', 'user']
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
          },
          {
            path: 'edit/:id',
            element: <UserEditPage />,
            meta: {
              title: '编辑用户',
              permissions: ['user:edit'],
              hidden: true // 不在菜单中显示
            }
          }
        ]
      },
      {
        path: 'order',
        meta: {
          title: '订单管理',
          icon: '📦',
          requiresAuth: true,
          roles: ['admin']
        },
        children: [
          {
            path: 'list',
            element: <OrderListPage />,
            meta: {
              title: '订单列表',
              permissions: ['order:list']
            }
          },
          {
            path: 'detail/:id',
            element: <OrderDetailPage />,
            meta: {
              title: '订单详情',
              permissions: ['order:detail'],
              hidden: true
            }
          }
        ]
      },
      {
        path: 'admin',
        element: <AdminPage />,
        meta: {
          title: '系统管理',
          icon: '⚙️',
          requiresAuth: true,
          roles: ['admin']
        }
      }
    ]
  },
  {
    path: '/login',
    element: <LoginPage />,
    meta: {
      title: '登录',
      hidden: true
    }
  },
  {
    path: '/403',
    element: <ForbiddenPage />,
    meta: {
      title: '无权限',
      hidden: true
    }
  },
  {
    path: '*',
    element: <NotFoundPage />,
    meta: {
      title: '404',
      hidden: true
    }
  }
]

// ==================== 权限过滤函数 ====================

/**
 * 根据用户权限过滤路由
 */
function filterRoutesByPermission(routes, userInfo) {
  return routes.filter(route => {
    // 1. 检查是否需要登录
    if (route.meta?.requiresAuth && !userInfo) {
      return false
    }

    // 2. 检查角色权限
    if (route.meta?.roles && route.meta.roles.length > 0) {
      if (!userInfo || !route.meta.roles.includes(userInfo.role)) {
        return false
      }
    }

    // 3. 检查权限码
    if (route.meta?.permissions && route.meta.permissions.length > 0) {
      if (!userInfo || !hasPermission(userInfo.permissions, route.meta.permissions)) {
        return false
      }
    }

    // 4. 递归过滤子路由
    if (route.children) {
      route.children = filterRoutesByPermission(route.children, userInfo)
    }

    return true
  })
}

/**
 * 检查用户是否有权限
 */
function hasPermission(userPermissions, requiredPermissions) {
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  )
}

// ==================== 动态路由 Hook ====================

/**
 * 自定义 Hook：根据用户权限生成路由
 */
function useDynamicRoutes(userInfo) {
  const [routes, setRoutes] = useState([])

  useEffect(() => {
    // 根据用户权限过滤路由
    const filteredRoutes = filterRoutesByPermission(routeConfig, userInfo)
    setRoutes(filteredRoutes)
  }, [userInfo])

  return routes
}

// ==================== 动态菜单生成 ====================

/**
 * 根据路由配置生成菜单
 */
function generateMenu(routes) {
  return routes
    .filter(route => !route.meta?.hidden) // 过滤隐藏的路由
    .map(route => ({
      path: route.path,
      title: route.meta?.title,
      icon: route.meta?.icon,
      children: route.children ? generateMenu(route.children) : []
    }))
}

/**
 * 菜单组件
 */
function Menu({ routes }) {
  const menuItems = generateMenu(routes)

  return (
    <nav className="menu">
      <h3>导航菜单</h3>
      {menuItems.map(item => (
        <MenuItem key={item.path} item={item} />
      ))}
    </nav>
  )
}

function MenuItem({ item, parentPath = '' }) {
  const fullPath = parentPath ? `${parentPath}/${item.path}` : item.path

  return (
    <div className="menu-item">
      {item.children && item.children.length > 0 ? (
        <div>
          <div className="menu-title">
            {item.icon} {item.title}
          </div>
          <div className="menu-children">
            {item.children.map(child => (
              <MenuItem key={child.path} item={child} parentPath={fullPath} />
            ))}
          </div>
        </div>
      ) : (
        <Link to={fullPath} className="menu-link">
          {item.icon} {item.title}
        </Link>
      )}
    </div>
  )
}

// ==================== 主应用组件 ====================

export function DynamicRouteApp() {
  // 模拟用户信息（实际项目中从 Context 或 Redux 获取）
  const [userInfo, setUserInfo] = useState(null)

  // 模拟登录
  const handleLogin = (role) => {
    const mockUsers = {
      admin: {
        id: 1,
        username: 'admin',
        role: 'admin',
        permissions: ['user:list', 'user:add', 'user:edit', 'user:delete', 'order:list', 'order:detail']
      },
      user: {
        id: 2,
        username: 'user',
        role: 'user',
        permissions: ['user:list', 'user:add']
      }
    }
    setUserInfo(mockUsers[role])
  }

  // 根据用户权限生成动态路由
  const dynamicRoutes = useDynamicRoutes(userInfo)
  const element = useRoutes(dynamicRoutes)

  return (
    <div className="app">
      <div className="login-panel">
        <button onClick={() => handleLogin('admin')}>以管理员登录</button>
        <button onClick={() => handleLogin('user')}>以普通用户登录</button>
        <button onClick={() => setUserInfo(null)}>退出登录</button>
        {userInfo && <span>当前用户: {userInfo.username} ({userInfo.role})</span>}
      </div>

      {userInfo && <Menu routes={dynamicRoutes} />}
      
      <div className="content">
        {element}
      </div>
    </div>
  )
}

// ==================== 页面组件 ====================

function Layout({ children }) {
  return <div className="layout">{children}</div>
}

function HomePage() {
  return <div><h2>首页</h2><p>欢迎使用权限管理系统</p></div>
}

function UserListPage() {
  return <div><h2>用户列表</h2><p>显示所有用户</p></div>
}

function UserAddPage() {
  return <div><h2>添加用户</h2><p>添加新用户表单</p></div>
}

function UserEditPage() {
  return <div><h2>编辑用户</h2><p>编辑用户信息</p></div>
}

function OrderListPage() {
  return <div><h2>订单列表</h2><p>显示所有订单</p></div>
}

function OrderDetailPage() {
  return <div><h2>订单详情</h2><p>订单详细信息</p></div>
}

function AdminPage() {
  return <div><h2>系统管理</h2><p>系统配置和管理</p></div>
}

function LoginPage() {
  return <div><h2>登录页</h2></div>
}

function ForbiddenPage() {
  return <div><h2>403 - 无权限访问</h2></div>
}

function NotFoundPage() {
  return <div><h2>404 - 页面不存在</h2></div>
}

/**
 * 知识点总结：
 * 
 * 1. 动态路由实现步骤
 *    ① 定义完整路由配置（包含权限信息）
 *    ② 根据用户权限过滤路由
 *    ③ 使用 useRoutes 生成路由
 *    ④ 根据路由配置生成菜单
 * 
 * 2. 权限判断逻辑
 *    - requiresAuth: 是否需要登录
 *    - roles: 角色权限（粗粒度）
 *    - permissions: 权限码（细粒度）
 * 
 * 3. 与 Vue Router 的对比
 *    Vue: router.addRoute() 动态添加
 *    React: 过滤路由配置 + useRoutes
 * 
 * 4. 优势
 *    - 菜单和路由自动同步
 *    - 无权限的路由不会被注册
 *    - 更安全（前端 + 后端双重验证）
 */
