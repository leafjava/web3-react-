# React 多步骤表单完整教程

> 从基础到进阶，从理论到实践，从面试到项目

---

## 📚 目录结构

```
15_受控和非受控组件/
├── 01_受控组件的基本使用.jsx          # 基础：单个输入框
├── 02_自己提交form的表单.jsx           # 基础：表单提交
├── 03_多个表单同一个函数.jsx           # 重要：统一处理模式
├── 04_Checkbox单选多选.jsx             # 基础：复选框
├── 05_Select的单选多选.jsx             # 基础：下拉框
├── 06_非受控组件的使用.jsx             # 对比：非受控组件
├── 07_多步骤表单-杠杆交易.jsx          # ⭐ 核心：基础方案
├── 08_多步骤表单-进阶方案.jsx          # ⭐ 核心：进阶方案
├── 面试回答模板-多步骤表单.md          # 📝 面试必看
├── INTERVIEW_GUIDE.md                  # 📖 面试指南
├── 方案对比.md                         # 📊 方案对比
├── multi-step-form.css                 # 🎨 样式文件
└── README.md                           # 📘 本文件
```

---

## 🎯 学习路径

### 第一阶段：基础知识（必学）

**1. 理解受控组件**
- 📄 文件：`01_受控组件的基本使用.jsx`
- 🎓 知识点：
  - 什么是受控组件
  - value + onChange 模式
  - 与 Vue v-model 的对比

**2. 统一表单处理**
- 📄 文件：`03_多个表单同一个函数.jsx`
- 🎓 知识点：
  - 使用 name 属性
  - 动态键名 `[name]: value`
  - 处理不同类型输入

**3. 各种输入类型**
- 📄 文件：`04_Checkbox单选多选.jsx`、`05_Select的单选多选.jsx`
- 🎓 知识点：
  - checkbox 处理
  - radio 处理
  - select 处理

---

### 第二阶段：实战项目（核心）

**4. 多步骤表单 - 基础方案**
- 📄 文件：`07_多步骤表单-杠杆交易.jsx`
- 🎓 知识点：
  - 步骤管理（currentStep）
  - 表单验证（validateCurrentStep）
  - 计算属性（calculatePositionSize）
  - 统一输入处理（handleInputChange）

**示例场景：** Web3 杠杆交易开仓
```
步骤 1: 选择交易对 → 步骤 2: 设置杠杆 → 步骤 3: 止盈止损 → 步骤 4: 确认订单
```

**关键代码：**
```javascript
// 1. 状态管理
this.state = {
  currentStep: 1,
  tradingPair: 'ETH/USDT',
  leverage: 10,
  collateral: '',
  errors: {}
}

// 2. 统一输入处理
handleInputChange = (event) => {
  const { name, value, type, checked } = event.target
  this.setState({
    [name]: type === 'checkbox' ? checked : value
  })
}

// 3. 步骤验证
validateCurrentStep = () => {
  const errors = {}
  // 验证逻辑...
  return Object.keys(errors).length === 0
}

// 4. 步骤切换
nextStep = () => {
  if (this.validateCurrentStep()) {
    this.setState({ currentStep: this.state.currentStep + 1 })
  }
}
```

---

**5. 多步骤表单 - 进阶方案**
- 📄 文件：`08_多步骤表单-进阶方案.jsx`
- 🎓 知识点：
  - 自定义 Hook（useMultiStepForm、useFormData）
  - 组件拆分（每个步骤独立组件）
  - 性能优化（useMemo、React.memo）
  - 配置化管理（步骤数组配置）

**关键代码：**
```javascript
// 1. 自定义 Hook
function useMultiStepForm(totalSteps) {
  const [currentStep, setCurrentStep] = useState(1)
  
  const next = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps))
  const prev = () => setCurrentStep(prev => Math.max(prev - 1, 1))
  
  return { currentStep, next, prev }
}

// 2. 步骤组件拆分
function Step1TradingPair({ formData, updateField, errors }) {
  return <div>...</div>
}

// 3. 配置化管理
const steps = [
  { title: '选择交易对', component: Step1TradingPair },
  { title: '设置杠杆', component: Step2Leverage },
]

// 4. 性能优化
const positionSize = useMemo(() => {
  return parseFloat(formData.collateral || 0) * formData.leverage
}, [formData.collateral, formData.leverage])
```

---

### 第三阶段：面试准备（加分）

**6. 面试回答模板**
- 📄 文件：`面试回答模板-多步骤表单.md`
- 📝 内容：
  - 标准回答框架
  - Vue vs React 对比
  - 基础方案 vs 进阶方案
  - 实战案例讲解
  - 加分项说明

**7. 面试指南**
- 📄 文件：`INTERVIEW_GUIDE.md`
- 📖 内容：
  - 核心考点分析
  - 知识体系梳理
  - 高频追问及答案
  - 学习路径建议

**8. 方案对比**
- 📄 文件：`方案对比.md`
- 📊 内容：
  - 基础 vs 进阶详细对比
  - 适用场景分析
  - 迁移路径指导

---

## 🚀 快速开始

### 1. 运行基础方案

```bash
# 在 03_learn_component 目录下
npm start
```

然后在 `src/index.js` 中导入：
```javascript
import LeverageTradeForm from './15_受控和非受控组件/07_多步骤表单-杠杆交易'

root.render(<LeverageTradeForm />)
```

### 2. 运行进阶方案

```javascript
import LeverageTradeFormAdvanced from './15_受控和非受控组件/08_多步骤表单-进阶方案'

root.render(<LeverageTradeFormAdvanced />)
```

---

## 💡 核心知识点

### 1. 受控组件三要素

```javascript
const [value, setValue] = useState('')

<input 
  value={value}                          // ① 绑定 state
  onChange={(e) => setValue(e.target.value)}  // ② 更新 state
/>
// ③ state 更新触发重新渲染
```

### 2. 统一表单处理模式

```javascript
// 使用 name 属性 + 动态键名
const handleInputChange = (e) => {
  const { name, value, type, checked } = e.target
  setFormData({
    ...formData,
    [name]: type === 'checkbox' ? checked : value
  })
}
```

### 3. 多步骤表单核心

```javascript
// ① 步骤状态
const [currentStep, setCurrentStep] = useState(1)

// ② 步骤验证
const validateCurrentStep = () => { /* ... */ }

// ③ 步骤切换
const nextStep = () => {
  if (validateCurrentStep()) {
    setCurrentStep(prev => prev + 1)
  }
}

// ④ 条件渲染
{currentStep === 1 && <Step1 />}
{currentStep === 2 && <Step2 />}
```

---

## 🎯 实战场景

### 场景 1：电商结算流程
```
购物车 → 填写地址 → 选择支付 → 确认订单
```

### 场景 2：用户注册流程
```
基本信息 → 账号设置 → 邮箱验证 → 完成注册
```

### 场景 3：Web3 杠杆交易（本教程示例）
```
选择交易对 → 设置杠杆 → 止盈止损 → 确认开仓
```

### 场景 4：问卷调查
```
个人信息 → 问题 1-5 → 问题 6-10 → 提交问卷
```

---

## 📊 方案选择指南

| 场景 | 推荐方案 | 理由 |
|-----|---------|------|
| 快速原型 | 基础方案 | 开发快，代码少 |
| 小型表单（< 10 字段） | 基础方案 | 简单够用 |
| 大型表单（10+ 字段） | 进阶方案 | 易维护，可复用 |
| 需要复用 | 进阶方案 | 自定义 Hook |
| 团队协作 | 进阶方案 | 组件拆分，并行开发 |
| 长期维护 | 进阶方案 | 可维护性强 |

---

## 🔥 常见问题

### Q1: 为什么不用非受控组件？

**A:** 非受控组件使用 ref 直接操作 DOM，适合简单场景（如文件上传）。但多步骤表单需要：
- 实时验证
- 步骤间数据共享
- 动态计算
- 条件渲染

这些都需要 React 掌控数据，所以必须用受控组件。

---

### Q2: 基础方案和进阶方案的主要区别？

**A:** 
| 维度 | 基础方案 | 进阶方案 |
|-----|---------|---------|
| 组件结构 | 单个大组件 | 多个小组件 |
| 逻辑复用 | 难以复用 | 自定义 Hook |
| 性能 | 一般 | 优秀（useMemo） |
| 可维护性 | 中等 | 优秀 |

---

### Q3: 如何处理表单数据持久化？

**A:**
```javascript
// 方案 1: localStorage
useEffect(() => {
  localStorage.setItem('formData', JSON.stringify(formData))
}, [formData])

// 方案 2: 后端草稿接口
const saveDraft = async () => {
  await fetch('/api/draft', {
    method: 'POST',
    body: JSON.stringify(formData)
  })
}
```

---

### Q4: 如何优化大表单性能？

**A:**
```javascript
// 1. 使用 useMemo 缓存计算
const result = useMemo(() => calculate(), [deps])

// 2. 使用 React.memo 避免重渲染
const Step1 = React.memo(({ formData }) => <div>...</div>)

// 3. 懒加载步骤组件
const Step1 = lazy(() => import('./Step1'))

// 4. 使用 useReducer 管理复杂状态
const [state, dispatch] = useReducer(reducer, initialState)
```

---

## 🎓 学习建议

### 初学者（0-3 个月）
1. ✅ 先学习 `01-06` 基础文件
2. ✅ 理解受控组件概念
3. ✅ 掌握统一表单处理模式
4. ✅ 完成基础方案（07）

### 进阶者（3-6 个月）
1. ✅ 学习进阶方案（08）
2. ✅ 理解自定义 Hook
3. ✅ 掌握性能优化技巧
4. ✅ 阅读面试指南

### 面试准备
1. ✅ 阅读面试回答模板
2. ✅ 理解方案对比
3. ✅ 准备实战案例
4. ✅ 练习口头表达

---

## 🔗 相关资源

### 本项目资源
- **CoderWhy 课程基础：** `03_learn_component/src/15_受控和非受控组件`
- **状态管理思路：** `01_Learn_React_Basic/05_购物车阶段案例`

### 官方文档
- [React Forms](https://react.dev/reference/react-dom/components/input)
- [React Hooks](https://react.dev/reference/react)

### 推荐库
- [React Hook Form](https://react-hook-form.com/) - 高性能表单库
- [Zod](https://zod.dev/) - TypeScript 优先的验证库
- [Formik](https://formik.org/) - 功能全面的表单库

---

## 📝 总结

### 核心思路
1. **受控组件是基础** - 所有表单数据由 React state 管理
2. **统一处理是关键** - 使用 name + [name]: value 模式
3. **步骤管理是核心** - currentStep + 条件渲染
4. **验证策略要合理** - 每步独立验证
5. **用户体验要友好** - 步骤指示器、错误提示、加载状态

### 学习路径
```
基础受控组件 → 统一表单处理 → 多步骤表单基础 → 多步骤表单进阶 → 面试准备
```

### 记住
- 🎯 简单问题用简单方案
- 🚀 复杂问题用进阶方案
- 💡 理论结合实践
- 🎤 展示思考过程

---

## 🤝 贡献

如果你有更好的实现方案或发现问题，欢迎提出！

---

**祝你学习愉快，面试顺利！** 🎉
