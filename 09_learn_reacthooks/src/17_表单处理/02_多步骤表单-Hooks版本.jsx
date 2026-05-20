/**
 * 多步骤表单 - React Hooks 版本
 * 
 * 使用 useState + 自定义 Hook 实现多步骤表单
 * 对比类组件版本（03_learn_component/src/15_受控和非受控组件/07_多步骤表单-杠杆交易.jsx）
 */

import React, { useState } from 'react'

// ==================== 自定义 Hook: 多步骤表单管理 ====================

function useMultiStepForm(steps) {
  const [currentStep, setCurrentStep] = useState(0)
  
  const next = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  }
  
  const prev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }
  
  const goTo = (step) => {
    setCurrentStep(step)
  }
  
  return {
    currentStep,
    step: steps[currentStep],
    steps,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    next,
    prev,
    goTo,
  }
}

// ==================== 自定义 Hook: 表单数据管理 ====================

function useFormData(initialData) {
  const [data, setData] = useState(initialData)
  
  const updateField = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }))
  }
  
  const updateFields = (fields) => {
    setData(prev => ({ ...prev, ...fields }))
  }
  
  const reset = () => {
    setData(initialData)
  }
  
  return {
    data,
    updateField,
    updateFields,
    reset,
  }
}

// ==================== 步骤 1: 选择交易对 ====================

function Step1({ data, updateField }) {
  return (
    <div className="step-content">
      <h2>步骤 1: 选择交易对和方向</h2>
      
      <div className="form-group">
        <label>交易对:</label>
        <select 
          value={data.tradingPair} 
          onChange={(e) => updateField('tradingPair', e.target.value)}
        >
          <option value="ETH/USDT">ETH/USDT</option>
          <option value="BTC/USDT">BTC/USDT</option>
          <option value="BNB/USDT">BNB/USDT</option>
        </select>
      </div>

      <div className="form-group">
        <label>交易方向:</label>
        <div className="radio-group">
          <label className={data.direction === 'long' ? 'selected' : ''}>
            <input
              type="radio"
              value="long"
              checked={data.direction === 'long'}
              onChange={(e) => updateField('direction', e.target.value)}
            />
            <span>📈 做多 (Long)</span>
          </label>
          
          <label className={data.direction === 'short' ? 'selected' : ''}>
            <input
              type="radio"
              value="short"
              checked={data.direction === 'short'}
              onChange={(e) => updateField('direction', e.target.value)}
            />
            <span>📉 做空 (Short)</span>
          </label>
        </div>
      </div>
    </div>
  )
}

// ==================== 步骤 2: 设置杠杆 ====================

function Step2({ data, updateField }) {
  const positionSize = data.collateral * data.leverage
  const liquidationPrice = data.direction === 'long' 
    ? 2000 * (1 - 1 / data.leverage)
    : 2000 * (1 + 1 / data.leverage)

  return (
    <div className="step-content">
      <h2>步骤 2: 设置杠杆和保证金</h2>
      
      <div className="form-group">
        <label>杠杆倍数: {data.leverage}x</label>
        <input
          type="range"
          min="1"
          max="100"
          value={data.leverage}
          onChange={(e) => updateField('leverage', Number(e.target.value))}
        />
        <div className="leverage-marks">
          <span>1x</span>
          <span>25x</span>
          <span>50x</span>
          <span>75x</span>
          <span>100x</span>
        </div>
      </div>

      <div className="form-group">
        <label>保证金 (USDT):</label>
        <input
          type="number"
          value={data.collateral}
          onChange={(e) => updateField('collateral', e.target.value)}
          placeholder="输入保证金金额"
          step="0.01"
        />
      </div>

      {data.collateral && (
        <div className="info-box">
          <h3>仓位信息</h3>
          <div className="info-row">
            <span>仓位大小:</span>
            <strong>{positionSize.toFixed(2)} USDT</strong>
          </div>
          <div className="info-row">
            <span>预计强平价:</span>
            <strong>${liquidationPrice.toFixed(2)}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== 步骤 3: 止盈止损 ====================

function Step3({ data, updateField }) {
  return (
    <div className="step-content">
      <h2>步骤 3: 设置止盈止损（可选）</h2>
      
      <div className="form-group">
        <label>止盈价格 (USDT):</label>
        <input
          type="number"
          value={data.takeProfitPrice}
          onChange={(e) => updateField('takeProfitPrice', e.target.value)}
          placeholder="达到此价格自动平仓获利"
          step="0.01"
        />
      </div>

      <div className="form-group">
        <label>止损价格 (USDT):</label>
        <input
          type="number"
          value={data.stopLossPrice}
          onChange={(e) => updateField('stopLossPrice', e.target.value)}
          placeholder="达到此价格自动平仓止损"
          step="0.01"
        />
      </div>

      <div className="info-box warning">
        <p>💡 提示：止盈止损可以帮助您自动管理风险，建议设置</p>
      </div>
    </div>
  )
}

// ==================== 步骤 4: 确认订单 ====================

function Step4({ data, updateField }) {
  const positionSize = data.collateral * data.leverage
  const liquidationPrice = data.direction === 'long' 
    ? 2000 * (1 - 1 / data.leverage)
    : 2000 * (1 + 1 / data.leverage)

  return (
    <div className="step-content">
      <h2>步骤 4: 确认订单信息</h2>
      
      <div className="order-summary">
        <h3>订单摘要</h3>
        
        <div className="summary-row">
          <span>交易对:</span>
          <strong>{data.tradingPair}</strong>
        </div>
        
        <div className="summary-row">
          <span>方向:</span>
          <strong className={data.direction}>
            {data.direction === 'long' ? '做多 📈' : '做空 📉'}
          </strong>
        </div>
        
        <div className="summary-row">
          <span>杠杆:</span>
          <strong>{data.leverage}x</strong>
        </div>
        
        <div className="summary-row">
          <span>保证金:</span>
          <strong>{data.collateral} USDT</strong>
        </div>
        
        <div className="summary-row">
          <span>仓位大小:</span>
          <strong>{positionSize.toFixed(2)} USDT</strong>
        </div>
        
        <div className="summary-row">
          <span>预计强平价:</span>
          <strong className="warning">${liquidationPrice.toFixed(2)}</strong>
        </div>
        
        {data.takeProfitPrice && (
          <div className="summary-row">
            <span>止盈价格:</span>
            <strong className="success">${data.takeProfitPrice}</strong>
          </div>
        )}
        
        {data.stopLossPrice && (
          <div className="summary-row">
            <span>止损价格:</span>
            <strong className="danger">${data.stopLossPrice}</strong>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={data.agreedToTerms}
            onChange={(e) => updateField('agreedToTerms', e.target.checked)}
          />
          <span>我已阅读并同意 <a href="#terms">交易条款</a> 和 <a href="#risks">风险提示</a></span>
        </label>
      </div>
    </div>
  )
}

// ==================== 主组件 ====================

function LeverageTradeFormHooks() {
  // 使用自定义 Hook 管理步骤
  const { currentStep, isFirstStep, isLastStep, next, prev, goTo } = useMultiStepForm([
    Step1,
    Step2,
    Step3,
    Step4,
  ])
  
  // 使用自定义 Hook 管理表单数据
  const { data, updateField, updateFields, reset } = useFormData({
    tradingPair: 'ETH/USDT',
    direction: 'long',
    leverage: 10,
    collateral: '',
    takeProfitPrice: '',
    stopLossPrice: '',
    agreedToTerms: false,
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  
  // 验证当前步骤
  const validateStep = () => {
    const newErrors = {}
    
    switch (currentStep) {
      case 0:
        if (!data.tradingPair) newErrors.tradingPair = '请选择交易对'
        if (!data.direction) newErrors.direction = '请选择方向'
        break
      
      case 1:
        if (!data.collateral || parseFloat(data.collateral) <= 0) {
          newErrors.collateral = '请输入有效的保证金'
        }
        break
      
      case 3:
        if (!data.agreedToTerms) {
          newErrors.agreedToTerms = '请同意交易条款'
        }
        break
      
      default:
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // 下一步
  const handleNext = () => {
    if (validateStep()) {
      next()
    }
  }
  
  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateStep()) return
    
    setIsSubmitting(true)
    
    try {
      console.log('提交订单:', data)
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('开仓成功！')
      reset()
      goTo(0)
    } catch (error) {
      alert('开仓失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // 渲染当前步骤
  const CurrentStepComponent = [Step1, Step2, Step3, Step4][currentStep]
  
  return (
    <div className="leverage-trade-form">
      <h1>杠杆交易开仓 (Hooks 版本)</h1>
      
      {/* 步骤指示器 */}
      <div className="step-indicator">
        {['选择交易对', '设置杠杆', '止盈止损', '确认开仓'].map((title, index) => (
          <div 
            key={index}
            className={`step ${currentStep === index ? 'active' : ''} ${currentStep > index ? 'completed' : ''}`}
            onClick={() => currentStep > index && goTo(index)}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-title">{title}</div>
          </div>
        ))}
      </div>
      
      {/* 表单内容 */}
      <form onSubmit={handleSubmit}>
        <CurrentStepComponent data={data} updateField={updateField} />
        
        {/* 错误提示 */}
        {Object.keys(errors).length > 0 && (
          <div className="error-box">
            {Object.values(errors).map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}
        
        {/* 导航按钮 */}
        <div className="form-actions">
          {!isFirstStep && (
            <button type="button" onClick={prev} className="btn btn-secondary">
              上一步
            </button>
          )}
          
          {!isLastStep ? (
            <button type="button" onClick={handleNext} className="btn btn-primary">
              下一步
            </button>
          ) : (
            <button type="submit" className="btn btn-success" disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : '确认开仓'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default LeverageTradeFormHooks

/**
 * Hooks 版本 vs 类组件版本对比：
 * 
 * 类组件版本（CoderWhy 课程）：
 * ✅ 所有逻辑在一个组件中，容易理解
 * ✅ 使用 this.state 和 this.setState
 * ❌ 代码较长，难以复用
 * ❌ 生命周期方法复杂
 * 
 * Hooks 版本（现代实践）：
 * ✅ 使用自定义 Hook 复用逻辑
 * ✅ 代码更简洁，易于测试
 * ✅ 每个步骤独立组件，职责清晰
 * ✅ 更容易维护和扩展
 * 
 * 自定义 Hook 的优势：
 * - useMultiStepForm: 复用多步骤逻辑
 * - useFormData: 复用表单数据管理
 * - 可以在多个表单中使用
 */

/**
 * 面试回答模板：
 * 
 * "在 Web3 项目中处理复杂表单，我会：
 * 
 * 1. 基础方案（小型项目）：
 *    - 使用受控组件 + useState（CoderWhy 课程学到的）
 *    - 统一的 handleInputChange 处理所有输入
 *    - 使用 currentStep 状态控制步骤
 * 
 * 2. 进阶方案（中大型项目）：
 *    - 使用 React Hook Form 减少重复代码
 *    - 使用 Zod 做类型安全的表单验证
 *    - 自定义 Hook 复用多步骤逻辑
 * 
 * 3. 杠杆交易这种复杂表单：
 *    - 分步骤组件，每步独立验证
 *    - 计算派生数据（仓位大小、强平价）
 *    - 最后一步展示完整摘要
 *    - 类似电商结算流程
 * 
 * 我在 CoderWhy 的课程中学习了受控组件的基础，
 * 然后扩展到多步骤表单和现代化的 Hook Form 方案。"
 */
