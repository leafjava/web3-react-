/**
 * 多步骤表单 - 进阶方案
 * 使用 React Hook Form + 自定义 Hook + 组件拆分
 * 
 * 适用场景：大型复杂表单、需要类型安全、团队协作项目
 */

import React, { useState, useMemo } from 'react'
import './multi-step-form.css'

// ==================== 自定义 Hook: 多步骤表单管理 ====================

function useMultiStepForm(totalSteps) {
  const [currentStep, setCurrentStep] = useState(1)

  const next = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
  }

  const prev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const goTo = (step) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step)
    }
  }

  const reset = () => {
    setCurrentStep(1)
  }

  return {
    currentStep,
    next,
    prev,
    goTo,
    reset,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps,
    progress: (currentStep / totalSteps) * 100,
  }
}

// ==================== 自定义 Hook: 表单数据管理 ====================

function useFormData(initialData) {
  const [formData, setFormData] = useState(initialData)
  const [errors, setErrors] = useState({})

  const updateField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // 清除该字段的错误
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const updateFields = (fields) => {
    setFormData((prev) => ({
      ...prev,
      ...fields,
    }))
  }

  const setFieldError = (name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }))
  }

  const clearErrors = () => {
    setErrors({})
  }

  const reset = () => {
    setFormData(initialData)
    setErrors({})
  }

  return {
    formData,
    errors,
    updateField,
    updateFields,
    setFieldError,
    clearErrors,
    reset,
  }
}

// ==================== 步骤 1 组件：选择交易对 ====================

function Step1TradingPair({ formData, updateField, errors }) {
  return (
    <div className="step-content">
      <h2>步骤 1: 选择交易对和方向</h2>

      <div className="form-group">
        <label>交易对:</label>
        <select
          name="tradingPair"
          value={formData.tradingPair}
          onChange={(e) => updateField('tradingPair', e.target.value)}
        >
          <option value="ETH/USDT">ETH/USDT</option>
          <option value="BTC/USDT">BTC/USDT</option>
          <option value="BNB/USDT">BNB/USDT</option>
          <option value="SOL/USDT">SOL/USDT</option>
        </select>
        {errors.tradingPair && <span className="error">{errors.tradingPair}</span>}
      </div>

      <div className="form-group">
        <label>交易方向:</label>
        <div className="radio-group">
          <label className={`radio-card ${formData.direction === 'long' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="direction"
              value="long"
              checked={formData.direction === 'long'}
              onChange={(e) => updateField('direction', e.target.value)}
            />
            <span className="radio-label">
              <span className="direction-icon long">📈</span>
              做多 (Long)
              <small>预期价格上涨</small>
            </span>
          </label>

          <label className={`radio-card ${formData.direction === 'short' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="direction"
              value="short"
              checked={formData.direction === 'short'}
              onChange={(e) => updateField('direction', e.target.value)}
            />
            <span className="radio-label">
              <span className="direction-icon short">📉</span>
              做空 (Short)
              <small>预期价格下跌</small>
            </span>
          </label>
        </div>
        {errors.direction && <span className="error">{errors.direction}</span>}
      </div>
    </div>
  )
}

// ==================== 步骤 2 组件：设置杠杆 ====================

function Step2Leverage({ formData, updateField, errors }) {
  // 使用 useMemo 缓存计算结果
  const positionSize = useMemo(() => {
    const collateral = parseFloat(formData.collateral) || 0
    return collateral * formData.leverage
  }, [formData.collateral, formData.leverage])

  const liquidationPrice = useMemo(() => {
    const currentPrice = 2000 // 假设当前价格
    if (formData.direction === 'long') {
      return currentPrice * (1 - 1 / formData.leverage)
    } else {
      return currentPrice * (1 + 1 / formData.leverage)
    }
  }, [formData.direction, formData.leverage])

  return (
    <div className="step-content">
      <h2>步骤 2: 设置杠杆和保证金</h2>

      <div className="form-group">
        <label>杠杆倍数: {formData.leverage}x</label>
        <input
          type="range"
          name="leverage"
          min="1"
          max="100"
          value={formData.leverage}
          onChange={(e) => updateField('leverage', parseInt(e.target.value))}
          className="leverage-slider"
        />
        <div className="leverage-marks">
          <span>1x</span>
          <span>25x</span>
          <span>50x</span>
          <span>75x</span>
          <span>100x</span>
        </div>
        {errors.leverage && <span className="error">{errors.leverage}</span>}
      </div>

      <div className="form-group">
        <label>保证金 (USDT):</label>
        <input
          type="number"
          name="collateral"
          value={formData.collateral}
          onChange={(e) => updateField('collateral', e.target.value)}
          placeholder="输入保证金金额"
          step="0.01"
          min="0"
        />
        {errors.collateral && <span className="error">{errors.collateral}</span>}
      </div>

      {formData.collateral && (
        <div className="info-box">
          <h3>仓位信息预览</h3>
          <div className="info-row">
            <span>仓位大小:</span>
            <strong>{positionSize.toFixed(2)} USDT</strong>
          </div>
          <div className="info-row">
            <span>预计强平价:</span>
            <strong className="warning">${liquidationPrice.toFixed(2)}</strong>
          </div>
          <div className="info-row">
            <span>风险等级:</span>
            <strong className={formData.leverage > 50 ? 'danger' : formData.leverage > 20 ? 'warning' : 'success'}>
              {formData.leverage > 50 ? '高风险' : formData.leverage > 20 ? '中风险' : '低风险'}
            </strong>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== 步骤 3 组件：止盈止损 ====================

function Step3StopLoss({ formData, updateField, errors }) {
  return (
    <div className="step-content">
      <h2>步骤 3: 设置止盈止损（可选）</h2>

      <div className="form-group">
        <label>止盈价格 (USDT):</label>
        <input
          type="number"
          name="takeProfitPrice"
          value={formData.takeProfitPrice}
          onChange={(e) => updateField('takeProfitPrice', e.target.value)}
          placeholder="达到此价格自动平仓获利"
          step="0.01"
          min="0"
        />
        {errors.takeProfitPrice && <span className="error">{errors.takeProfitPrice}</span>}
        <small className="hint">建议设置在预期盈利目标价位</small>
      </div>

      <div className="form-group">
        <label>止损价格 (USDT):</label>
        <input
          type="number"
          name="stopLossPrice"
          value={formData.stopLossPrice}
          onChange={(e) => updateField('stopLossPrice', e.target.value)}
          placeholder="达到此价格自动平仓止损"
          step="0.01"
          min="0"
        />
        {errors.stopLossPrice && <span className="error">{errors.stopLossPrice}</span>}
        <small className="hint">建议设置在可承受的最大亏损范围内</small>
      </div>

      <div className="info-box warning">
        <h4>💡 风险管理建议</h4>
        <ul>
          <li>建议设置止损价格，控制最大亏损</li>
          <li>止盈价格可以帮助您锁定利润</li>
          <li>高杠杆交易建议必须设置止损</li>
        </ul>
      </div>
    </div>
  )
}

// ==================== 步骤 4 组件：确认订单 ====================

function Step4Confirmation({ formData, updateField, errors }) {
  const positionSize = parseFloat(formData.collateral || 0) * formData.leverage
  const liquidationPrice = formData.direction === 'long'
    ? 2000 * (1 - 1 / formData.leverage)
    : 2000 * (1 + 1 / formData.leverage)

  return (
    <div className="step-content">
      <h2>步骤 4: 确认订单信息</h2>

      <div className="order-summary">
        <h3>📋 订单摘要</h3>

        <div className="summary-section">
          <h4>基本信息</h4>
          <div className="summary-row">
            <span>交易对:</span>
            <strong>{formData.tradingPair}</strong>
          </div>
          <div className="summary-row">
            <span>方向:</span>
            <strong className={formData.direction === 'long' ? 'long' : 'short'}>
              {formData.direction === 'long' ? '做多 📈' : '做空 📉'}
            </strong>
          </div>
        </div>

        <div className="summary-section">
          <h4>仓位信息</h4>
          <div className="summary-row">
            <span>杠杆倍数:</span>
            <strong>{formData.leverage}x</strong>
          </div>
          <div className="summary-row">
            <span>保证金:</span>
            <strong>{formData.collateral} USDT</strong>
          </div>
          <div className="summary-row">
            <span>仓位大小:</span>
            <strong>{positionSize.toFixed(2)} USDT</strong>
          </div>
          <div className="summary-row">
            <span>预计强平价:</span>
            <strong className="warning">${liquidationPrice.toFixed(2)}</strong>
          </div>
        </div>

        {(formData.takeProfitPrice || formData.stopLossPrice) && (
          <div className="summary-section">
            <h4>风险控制</h4>
            {formData.takeProfitPrice && (
              <div className="summary-row">
                <span>止盈价格:</span>
                <strong className="success">${formData.takeProfitPrice}</strong>
              </div>
            )}
            {formData.stopLossPrice && (
              <div className="summary-row">
                <span>止损价格:</span>
                <strong className="danger">${formData.stopLossPrice}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="agreedToTerms"
            checked={formData.agreedToTerms}
            onChange={(e) => updateField('agreedToTerms', e.target.checked)}
          />
          <span>
            我已阅读并同意 <a href="#terms">交易条款</a> 和 <a href="#risks">风险提示</a>
          </span>
        </label>
        {errors.agreedToTerms && <span className="error">{errors.agreedToTerms}</span>}
      </div>

      <div className="info-box danger">
        <h4>⚠️ 风险提示</h4>
        <p>杠杆交易具有高风险，可能导致全部保证金损失。请确保您充分理解风险并谨慎操作。</p>
      </div>
    </div>
  )
}

// ==================== 步骤指示器组件 ====================

function StepIndicator({ currentStep, steps, goTo }) {
  return (
    <div className="step-indicator">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isActive = currentStep === stepNumber
        const isCompleted = currentStep > stepNumber

        return (
          <div
            key={stepNumber}
            className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            onClick={() => isCompleted && goTo(stepNumber)}
            style={{ cursor: isCompleted ? 'pointer' : 'default' }}
          >
            <div className="step-number">
              {isCompleted ? '✓' : stepNumber}
            </div>
            <div className="step-title">{step.title}</div>
          </div>
        )
      })}
    </div>
  )
}

// ==================== 主组件 ====================

export function LeverageTradeFormAdvanced() {
  // 初始表单数据
  const initialFormData = {
    tradingPair: 'ETH/USDT',
    direction: 'long',
    leverage: 10,
    collateral: '',
    takeProfitPrice: '',
    stopLossPrice: '',
    agreedToTerms: false,
  }

  // 使用自定义 Hook
  const { currentStep, next, prev, goTo, reset: resetSteps, isFirstStep, isLastStep } = useMultiStepForm(4)
  const { formData, errors, updateField, setFieldError, clearErrors, reset: resetForm } = useFormData(initialFormData)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // 步骤配置（配置化管理）
  const steps = [
    { title: '选择交易对', component: Step1TradingPair },
    { title: '设置杠杆', component: Step2Leverage },
    { title: '止盈止损', component: Step3StopLoss },
    { title: '确认开仓', component: Step4Confirmation },
  ]

  // 验证当前步骤
  const validateCurrentStep = () => {
    clearErrors()
    let isValid = true

    switch (currentStep) {
      case 1:
        if (!formData.tradingPair) {
          setFieldError('tradingPair', '请选择交易对')
          isValid = false
        }
        if (!formData.direction) {
          setFieldError('direction', '请选择交易方向')
          isValid = false
        }
        break

      case 2:
        if (!formData.collateral || parseFloat(formData.collateral) <= 0) {
          setFieldError('collateral', '请输入有效的保证金金额')
          isValid = false
        }
        if (formData.leverage < 1 || formData.leverage > 100) {
          setFieldError('leverage', '杠杆倍数必须在 1-100 之间')
          isValid = false
        }
        break

      case 3:
        if (formData.takeProfitPrice && parseFloat(formData.takeProfitPrice) <= 0) {
          setFieldError('takeProfitPrice', '止盈价格必须大于 0')
          isValid = false
        }
        if (formData.stopLossPrice && parseFloat(formData.stopLossPrice) <= 0) {
          setFieldError('stopLossPrice', '止损价格必须大于 0')
          isValid = false
        }
        break

      case 4:
        if (!formData.agreedToTerms) {
          setFieldError('agreedToTerms', '请同意交易条款')
          isValid = false
        }
        break

      default:
        break
    }

    return isValid
  }

  // 下一步
  const handleNext = () => {
    if (validateCurrentStep()) {
      next()
    }
  }

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateCurrentStep()) {
      return
    }

    setIsSubmitting(true)

    try {
      // 模拟 API 调用
      console.log('提交订单:', formData)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      alert('✅ 开仓成功！')

      // 重置表单
      resetForm()
      resetSteps()
    } catch (error) {
      console.error('开仓失败:', error)
      alert('❌ 开仓失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 渲染当前步骤组件
  const CurrentStepComponent = steps[currentStep - 1].component

  return (
    <div className="leverage-trade-form advanced">
      <h1>杠杆交易开仓（进阶方案）</h1>

      <StepIndicator currentStep={currentStep} steps={steps} goTo={goTo} />

      <form onSubmit={handleSubmit}>
        <CurrentStepComponent formData={formData} updateField={updateField} errors={errors} />

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

export default LeverageTradeFormAdvanced

/**
 * 进阶方案的优势：
 * 
 * 1. 自定义 Hook 复用逻辑
 *    - useMultiStepForm: 管理步骤状态
 *    - useFormData: 管理表单数据和验证
 * 
 * 2. 组件拆分，职责清晰
 *    - 每个步骤独立组件
 *    - 步骤指示器独立组件
 *    - 易于维护和测试
 * 
 * 3. 性能优化
 *    - 使用 useMemo 缓存计算结果
 *    - 避免不必要的重渲染
 * 
 * 4. 配置化管理
 *    - 步骤通过数组配置
 *    - 易于添加/删除步骤
 * 
 * 5. 更好的类型安全（可配合 TypeScript）
 *    - 表单数据结构清晰
 *    - 易于添加类型定义
 * 
 * 6. 更灵活的验证
 *    - 可以轻松集成 Zod / Yup
 *    - 验证逻辑集中管理
 */
