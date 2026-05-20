# useEffect 依赖数组原理详解

## 🎯 核心原理

### 1. 对比算法：Object.is()

React 使用 **Object.is()** 算法对比依赖数组中的每一项，判断是否发生变化。

```javascript
// Object.is() 的对比规则
Object.is(25, 25);                // true
Object.is('foo', 'foo');          // true
Object.is(false, false);          // true
Object.is(null, null);            // true
Object.is(undefined, undefined);  // true
Object.is(NaN, NaN);              // true（与 === 不同）
Object.is(+0, -0);                // false（与 === 不同）

// 引用类型：比较引用地址
Object.is({}, {});                // false（不同对象）
Object.is([], []);                // false（不同数组）

const obj = { a: 1 };
Object.is(obj, obj);              // true（同一对象）
```

### 2. 浅比较机制

**关键点：只比较引用，不比较内容**

```javascript
// 示例 1：基本类型 - 比较值
const [count, setCount] = useState(0);

useEffect(() => {
  console.log('count 变化了');
}, [count]); // count 从 0 变为 1，触发执行

// 示例 2：引用类型 - 比较引用地址
const [user, setUser] = useState({ name: 'Alice' });

useEffect(() => {
  console.log('user 变化了');
}, [user]); // 即使内容相同，新对象也会触发执行

// 每次渲染都创建新对象
setUser({ name: 'Alice' }); // 触发 effect
setUser({ name: 'Alice' }); // 再次触发 effect（虽然内容相同）
```

---

## 📊 三种使用场景

### 场景 1：不传依赖数组

```javascript
useEffect(() => {
  console.log('每次渲染都执行');
  // 组件每次渲染后都会执行
});

// 执行时机：
// 1. 组件挂载后
// 2. 组件每次更新后
```

**使用场景：**
- 需要在每次渲染后执行的操作
- 日志记录、性能监控等

**注意：** 通常不推荐，容易导致性能问题

---

### 场景 2：空依赖数组

```javascript
useEffect(() => {
  console.log('只在挂载时执行一次');
  
  // 模拟 componentDidMount
  fetchInitialData();
  
  return () => {
    // 模拟 componentWillUnmount
    console.log('组件卸载时执行');
  };
}, []); // 空数组

// 执行时机：
// 1. 组件挂载后执行一次
// 2. 组件卸载时执行清理函数
```

**使用场景：**
- 初始化数据获取
- 订阅事件监听
- 启动定时器
- 第三方库初始化

**等价于类组件：**
```javascript
class MyComponent extends React.Component {
  componentDidMount() {
    // useEffect(() => {}, []) 的 effect 部分
  }
  
  componentWillUnmount() {
    // useEffect(() => { return () => {} }, []) 的清理函数
  }
}
```

---

### 场景 3：传入依赖项

```javascript
const [count, setCount] = useState(0);
const [name, setName] = useState('Alice');

useEffect(() => {
  console.log('count 变化时执行');
  document.title = `Count: ${count}`;
}, [count]); // 只依赖 count

// 执行时机：
// 1. 组件挂载后
// 2. count 变化时
// name 变化不会触发此 effect
```

**使用场景：**
- 响应特定状态变化
- 根据 props 或 state 执行副作用
- 条件性数据获取

---

## ⚠️ 常见陷阱

### 陷阱 1：遗漏依赖项

```javascript
// ❌ 错误示例
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count); // count 始终是 0（闭包陷阱）
    }, 1000);
    
    return () => clearInterval(timer);
  }, []); // 遗漏 count 依赖
  
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// ✅ 正确方案 1：添加依赖
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // 获取最新的 count
  }, 1000);
  
  return () => clearInterval(timer);
}, [count]); // 添加 count 依赖

// ✅ 正确方案 2：使用函数式更新
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => {
      console.log(c); // 获取最新的 count
      return c;
    });
  }, 1000);
  
  return () => clearInterval(timer);
}, []); // 不需要依赖 count

// ✅ 正确方案 3：使用 useRef
const countRef = useRef(count);
countRef.current = count;

useEffect(() => {
  const timer = setInterval(() => {
    console.log(countRef.current); // 获取最新的 count
  }, 1000);
  
  return () => clearInterval(timer);
}, []); // 不需要依赖 count
```

**ESLint 规则：**
```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

---

### 陷阱 2：依赖项是对象或数组

```javascript
// ❌ 错误示例：每次渲染都创建新对象
function UserProfile({ userId }) {
  useEffect(() => {
    fetchUser({ id: userId, cache: true });
  }, [{ id: userId, cache: true }]); // 每次都是新对象！
}

// 问题：每次渲染都会执行 effect，因为对象引用不同

// ✅ 解决方案 1：只依赖基本类型
useEffect(() => {
  fetchUser({ id: userId, cache: true });
}, [userId]); // 只依赖 userId

// ✅ 解决方案 2：使用 useMemo 缓存对象
const config = useMemo(() => ({ 
  id: userId, 
  cache: true 
}), [userId]);

useEffect(() => {
  fetchUser(config);
}, [config]); // config 引用稳定

// ✅ 解决方案 3：JSON.stringify（不推荐，性能差）
const configStr = JSON.stringify({ id: userId, cache: true });

useEffect(() => {
  const config = JSON.parse(configStr);
  fetchUser(config);
}, [configStr]);
```

---

### 陷阱 3：依赖项是函数

```javascript
// ❌ 错误示例：每次渲染都创建新函数
function SearchBox() {
  const [query, setQuery] = useState('');
  
  const handleSearch = () => {
    console.log('搜索:', query);
  };
  
  useEffect(() => {
    // 每次渲染 handleSearch 都是新函数
    document.addEventListener('keydown', handleSearch);
    return () => document.removeEventListener('keydown', handleSearch);
  }, [handleSearch]); // handleSearch 每次都不同
}

// ✅ 解决方案 1：使用 useCallback
const handleSearch = useCallback(() => {
  console.log('搜索:', query);
}, [query]); // 只在 query 变化时重新创建

useEffect(() => {
  document.addEventListener('keydown', handleSearch);
  return () => document.removeEventListener('keydown', handleSearch);
}, [handleSearch]); // handleSearch 引用稳定

// ✅ 解决方案 2：将函数定义在 effect 内部
useEffect(() => {
  const handleSearch = () => {
    console.log('搜索:', query);
  };
  
  document.addEventListener('keydown', handleSearch);
  return () => document.removeEventListener('keydown', handleSearch);
}, [query]); // 只依赖 query
```

---

## 🔄 清理函数的执行时机

### 执行顺序

```javascript
useEffect(() => {
  console.log('1. Effect 执行');
  
  return () => {
    console.log('2. 清理函数执行');
  };
}, [dependency]);

// 执行顺序：
// 首次渲染：
//   1. Effect 执行

// dependency 变化时：
//   2. 清理函数执行（清理上一次的 effect）
//   1. Effect 执行（执行新的 effect）

// 组件卸载时：
//   2. 清理函数执行
```

### 实际示例

```javascript
function Timer() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log(`启动定时器，count = ${count}`);
    
    const timer = setInterval(() => {
      console.log(`定时器执行，count = ${count}`);
    }, 1000);
    
    return () => {
      console.log(`清除定时器，count = ${count}`);
      clearInterval(timer);
    };
  }, [count]);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}

// 点击按钮时的输出：
// 清除定时器，count = 0
// 启动定时器，count = 1
// 定时器执行，count = 1
// 定时器执行，count = 1
// ...
```

---

## 🎓 高级技巧

### 1. 跳过不必要的 Effect

```javascript
// 使用 enabled 标志控制
const [enabled, setEnabled] = useState(false);

useEffect(() => {
  if (!enabled) return; // 提前返回
  
  // 执行副作用
  fetchData();
}, [enabled]);

// 或者使用条件渲染
{enabled && <ComponentWithEffect />}
```

### 2. 防抖和节流

```javascript
// 防抖：延迟执行
useEffect(() => {
  const timer = setTimeout(() => {
    console.log('搜索:', query);
    fetchSearchResults(query);
  }, 500); // 500ms 后执行
  
  return () => clearTimeout(timer); // 清除上一次的定时器
}, [query]);

// 节流：限制执行频率
const lastCallRef = useRef(0);

useEffect(() => {
  const now = Date.now();
  if (now - lastCallRef.current < 1000) return; // 1 秒内只执行一次
  
  lastCallRef.current = now;
  console.log('滚动位置:', scrollY);
}, [scrollY]);
```

### 3. 异步数据获取

```javascript
useEffect(() => {
  let cancelled = false; // 取消标志
  
  const fetchData = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      
      if (!cancelled) { // 检查是否已取消
        setUser(data);
      }
    } catch (error) {
      if (!cancelled) {
        setError(error);
      }
    }
  };
  
  fetchData();
  
  return () => {
    cancelled = true; // 组件卸载时设置取消标志
  };
}, [userId]);
```

---

## 📝 最佳实践

### 1. 依赖数组完整性

```javascript
// ✅ 好的做法
useEffect(() => {
  fetchData(userId, filter);
}, [userId, filter]); // 包含所有使用的外部变量

// ❌ 不好的做法
useEffect(() => {
  fetchData(userId, filter);
}, [userId]); // 遗漏 filter
```

### 2. 避免过度依赖

```javascript
// ❌ 不好的做法：依赖整个对象
useEffect(() => {
  console.log(user.name);
}, [user]); // user 对象的任何属性变化都会触发

// ✅ 好的做法：只依赖需要的属性
useEffect(() => {
  console.log(user.name);
}, [user.name]); // 只在 name 变化时触发
```

### 3. 合理拆分 Effect

```javascript
// ❌ 不好的做法：一个 effect 做太多事
useEffect(() => {
  fetchUserData();
  subscribeToNotifications();
  trackPageView();
}, [userId]);

// ✅ 好的做法：按功能拆分
useEffect(() => {
  fetchUserData();
}, [userId]);

useEffect(() => {
  subscribeToNotifications();
  return () => unsubscribeFromNotifications();
}, [userId]);

useEffect(() => {
  trackPageView();
}, []);
```

---

## 🎯 面试回答模板

**问题：说说 useEffect 的依赖数组原理？**

**回答：**

useEffect 的依赖数组用于控制副作用函数的执行时机，主要涉及以下几个方面：

1. **对比机制**：React 使用 Object.is() 算法进行浅比较，对比依赖数组中的每一项。基本类型比较值，引用类型比较引用地址。

2. **三种场景**：
   - 不传依赖数组：每次渲染都执行
   - 空依赖数组：只在挂载时执行一次
   - 传入依赖项：依赖项变化时执行

3. **清理函数**：在组件卸载或下次 effect 执行前调用，用于清理副作用（如移除事件监听、清除定时器）。

4. **常见陷阱**：
   - 遗漏依赖项导致闭包陷阱
   - 依赖项是对象/数组导致每次都执行
   - 需要使用 useMemo/useCallback 优化

5. **最佳实践**：
   - 使用 ESLint 插件检查依赖完整性
   - 合理拆分 effect，按功能组织
   - 避免在依赖数组中使用对象字面量

在实际项目中，我封装过多个自定义 Hook，如 useWallet、useContractRead 等，都需要深入理解依赖数组原理才能正确实现。

---

## 🔗 相关资源

- [React 官方文档 - useEffect](https://react.dev/reference/react/useEffect)
- [useEffect 完整指南 - Dan Abramov](https://overreacted.io/a-complete-guide-to-useeffect/)
- [React Hooks 最佳实践](https://react.dev/learn/synchronizing-with-effects)
