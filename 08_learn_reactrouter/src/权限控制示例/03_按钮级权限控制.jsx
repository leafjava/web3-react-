/**
 * React 按钮级权限控制
 * 
 * 对应 Vue 的自定义指令：
 * Vue: v-permission="['user:add']"
 * React: <PermissionButton permission="user:add">添加</PermissionButton>
 * 
 * 实现方式：
 * 1. 高阶组件（HOC）
 * 2. 自定义 Hook
 * 3. 权限组件
 * 4. Context + 自定义指令（最接近 Vue）
 */

import React, { createContext, useContext } from 'react'

// ==================== 权限 Context ====================

const PermissionContext = createContext({
  permissions: [],
  role: null
})

/**
 * 权限 Provider
 */
export function PermissionProvider({ children, userInfo }) {
  return (
    <PermissionContext.Provider value={userInfo}>
      {children}
    </PermissionContext.Provider>
  )
}

/**
 * 使用权限的 Hook
 */
export function usePermission() {
  return useContext(PermissionContext)
}

// ==================== 方案 1: 权限组件（推荐）====================

/**
 * 权限按钮组件
 * 用法：<PermissionButton permission="user:add">添加用户</PermissionButton>
 */
export function PermissionButton({ permission, children, ...props }) {
  const { permissions } = usePermission()

  // 检查权限
  if (!hasPermission(permissions, permission)) {
    return null // 无权限，不渲染
  }

  return <button {...props}>{children}</button>
}

/**
 * 通用权限组件
 * 用法：<Permission permission="user:add"><button>添加</button></Permission>
 */
export function Permission({ permission, fallback = null, children }) {
  const { permissions } = usePermission()

  if (!hasPermission(permissions, permission)) {
    return fallback // 无权限，显示 fallback
  }

  return children
}

/**
 * 角色权限组件
 * 用法：<RolePermission roles={['admin']}><button>删除</button></RolePermission>
 */
export function RolePermission({ roles, fallback = null, children }) {
  const { role } = usePermission()

  if (!roles.includes(role)) {
    return fallback
  }

  return children
}

// ==================== 方案 2: 自定义 Hook ====================

/**
 * 检查权限的 Hook
 * 用法：const canAdd = useHasPermission('user:add')
 */
export function useHasPermission(permission) {
  const { permissions } = usePermission()
  return hasPermission(permissions, permission)
}

/**
 * 检查角色的 Hook
 * 用法：const isAdmin = useHasRole('admin')
 */
export function useHasRole(role) {
  const { role: userRole } = usePermission()
  return userRole === role
}

/**
 * 检查多个权限的 Hook
 * 用法：const { canAdd, canEdit, canDelete } = usePermissions(['user:add', 'user:edit', 'user:delete'])
 */
export function usePermissions(permissionList) {
  const { permissions } = usePermission()
  
  return permissionList.reduce((acc, permission) => {
    const key = permission.split(':')[1] // user:add -> add
    acc[`can${capitalize(key)}`] = hasPermission(permissions, permission)
    return acc
  }, {})
}

// ==================== 方案 3: 高阶组件（HOC）====================

/**
 * 权限高阶组件
 * 用法：const ProtectedButton = withPermission(Button, 'user:add')
 */
export function withPermission(Component, permission) {
  return function PermissionComponent(props) {
    const { permissions } = usePermission()

    if (!hasPermission(permissions, permission)) {
      return null
    }

    return <Component {...props} />
  }
}

/**
 * 角色高阶组件
 * 用法：const AdminButton = withRole(Button, 'admin')
 */
export function withRole(Component, requiredRole) {
  return function RoleComponent(props) {
    const { role } = usePermission()

    if (role !== requiredRole) {
      return null
    }

    return <Component {...props} />
  }
}

// ==================== 工具函数 ====================

/**
 * 检查是否有权限
 * 支持单个权限或权限数组
 */
function hasPermission(userPermissions = [], requiredPermission) {
  if (!requiredPermission) return true
  
  if (Array.isArray(requiredPermission)) {
    // 数组：需要满足所有权限
    return requiredPermission.every(p => userPermissions.includes(p))
  }
  
  // 字符串：单个权限
  return userPermissions.includes(requiredPermission)
}

/**
 * 首字母大写
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ==================== 使用示例 ====================

export function PermissionExample() {
  // 模拟用户信息
  const userInfo = {
    role: 'admin',
    permissions: ['user:list', 'user:add', 'user:edit', 'order:list']
  }

  return (
    <PermissionProvider userInfo={userInfo}>
      <div className="permission-example">
        <h2>按钮级权限控制示例</h2>

        {/* 方案 1: 使用权限组件 */}
        <section>
          <h3>方案 1: 权限组件</h3>
          <PermissionButton permission="user:add" onClick={() => alert('添加用户')}>
            添加用户
          </PermissionButton>
          
          <PermissionButton permission="user:delete" onClick={() => alert('删除用户')}>
            删除用户（无权限，不显示）
          </PermissionButton>

          <Permission permission="user:edit">
            <button>编辑用户</button>
          </Permission>

          <Permission 
            permission="user:delete" 
            fallback={<span style={{ color: 'gray' }}>删除（无权限）</span>}
          >
            <button>删除用户</button>
          </Permission>

          <RolePermission roles={['admin']}>
            <button>管理员专属按钮</button>
          </RolePermission>
        </section>

        {/* 方案 2: 使用 Hook */}
        <section>
          <h3>方案 2: 自定义 Hook</h3>
          <HookExample />
        </section>

        {/* 方案 3: 使用 HOC */}
        <section>
          <h3>方案 3: 高阶组件</h3>
          <HOCExample />
        </section>

        {/* 实际应用场景 */}
        <section>
          <h3>实际应用：用户管理页面</h3>
          <UserManagementPage />
        </section>
      </div>
    </PermissionProvider>
  )
}

// Hook 示例
function HookExample() {
  const canAdd = useHasPermission('user:add')
  const canDelete = useHasPermission('user:delete')
  const isAdmin = useHasRole('admin')

  const { canEdit, canExport } = usePermissions(['user:edit', 'user:export'])

  return (
    <div>
      {canAdd && <button>添加用户（Hook）</button>}
      {canDelete && <button>删除用户（Hook）</button>}
      {isAdmin && <button>管理员功能（Hook）</button>}
      {canEdit && <button>编辑用户（Hook）</button>}
      {canExport && <button>导出用户（Hook）</button>}
      
      <p>权限状态：canAdd={String(canAdd)}, canDelete={String(canDelete)}, isAdmin={String(isAdmin)}</p>
    </div>
  )
}

// HOC 示例
function HOCExample() {
  const AddButton = withPermission(
    (props) => <button {...props}>添加用户（HOC）</button>,
    'user:add'
  )

  const DeleteButton = withPermission(
    (props) => <button {...props}>删除用户（HOC）</button>,
    'user:delete'
  )

  const AdminButton = withRole(
    (props) => <button {...props}>管理员功能（HOC）</button>,
    'admin'
  )

  return (
    <div>
      <AddButton onClick={() => alert('添加')} />
      <DeleteButton onClick={() => alert('删除')} />
      <AdminButton onClick={() => alert('管理员')} />
    </div>
  )
}

// 实际应用场景
function UserManagementPage() {
  const users = [
    { id: 1, name: '张三', role: 'admin' },
    { id: 2, name: '李四', role: 'user' }
  ]

  return (
    <div className="user-management">
      <div className="toolbar">
        <PermissionButton permission="user:add">
          ➕ 添加用户
        </PermissionButton>
        
        <Permission permission="user:export">
          <button>📥 导出用户</button>
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

                <Permission 
                  permission="user:resetPassword"
                  fallback={<span style={{ color: 'gray' }}>重置密码（无权限）</span>}
                >
                  <button>重置密码</button>
                </Permission>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * 知识点总结：
 * 
 * 1. Vue vs React 按钮级权限对比
 * 
 * Vue 自定义指令：
 * <button v-permission="['user:add']">添加</button>
 * 
 * React 三种方案：
 * - 权限组件：<PermissionButton permission="user:add">添加</PermissionButton>
 * - 自定义 Hook：const canAdd = useHasPermission('user:add')
 * - 高阶组件：const AddButton = withPermission(Button, 'user:add')
 * 
 * 2. 推荐方案
 *    - 简单场景：权限组件（最直观）
 *    - 复杂逻辑：自定义 Hook（最灵活）
 *    - 组件复用：高阶组件（最优雅）
 * 
 * 3. 权限粒度
 *    - 页面级：路由守卫
 *    - 模块级：角色权限
 *    - 按钮级：权限码
 * 
 * 4. 最佳实践
 *    - 使用 Context 管理权限状态
 *    - 前端权限只是 UI 控制，后端必须验证
 *    - 权限码命名规范：模块:操作（user:add）
 *    - 提供 fallback 提示用户无权限
 */
