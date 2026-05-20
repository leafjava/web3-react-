/**
 * 多步骤表单示例 - Web3 杠杆交易开仓
 * 
 * 对应 CoderWhy 课程：
 * - 03_learn_component/src/15_受控和非受控组件（受控组件基础）
 * - 01_Learn_React_Basic/05_购物车阶段案例（状态管理思路）
 * 
 * 这个示例展示如何处理复杂的多步骤表单，类似电商结算流程
 */

import React, { PureComponent } from 'react'
import './multi-step-form.css'

export class LeverageTradeForm extends PureComponent {
  constructor() {
    super()

    this.state = {
      // 当前步骤（1-4）
      currentStep: 1,
      
      // 步骤 1: 选择交易对
      tradingPair: 'ETH/USDT',
      direction: 'long', // long 或 short
      
      // 步骤 2: 设置杠杆和金额
      leverage: 10,
      collateral: '', // 保证金
      
      // 步骤 3: 设置止盈止损
      takeProfitPrice: '',
      stopLossPrice: '',
      
      // 步骤 4: 确认信息
      agreedToTerms: false,
      
      // 表单验证错误
      errors: {},
      
      // 提交状态
      isSubmitting: false,
    }
  }

  // ==================== 步骤导航 ====================
  
  nextStep = () => {
    if (this.validateCurrentStep()) {
      this.setState({ currentStep: this.state.currentStep + 1 })
    }
  }

  prevStep = () => {
    this.setState({ 
      currentStep: this.state.currentStep - 1,
      errors: {} // 清空错误
    })
  }

  goToStep = (step) => {
    this.setState({ currentStep: step })
  }

  // ==================== 表单验证 ====================
  
  validateCurrentStep = () => {
    const { currentStep, tradingPair, direction, collateral, leverage } = this.state
    const errors = {}

    switch (currentStep) {
      case 1:
        if (!tradingPair) errors.tradingPair = '请选择交易对'
        if (!direction) errors.direction = '请选择做多或做空'
        break
      
      case 2:
        if (!collateral || parseFloat(collateral) <= 0) {
          errors.collateral = '请输入有效的保证金金额'
        }
        if (leverage < 1 || leverage > 100) {
          errors.leverage = '杠杆倍数必须在 1-100 之间'
        }
        break
      
      case 3:
        // 止盈止损是可选的，但如果填写了需要验证
        if (this.state.takeProfitPrice && parseFloat(this.state.takeProfitPrice) <= 0) {
          errors.takeProfitPrice = '止盈价格必须大于 0'
        }
        if (this.state.stopLossPrice && parseFloat(this.state.stopLossPrice) <= 0) {
          errors.stopLossPrice = '止损价格必须大于 0'
        }
        break
      
      case 4:
        if (!this.state.agreedToTerms) {
          errors.agreedToTerms = '请同意交易条款'
        }
        break
      
      default:
        break
    }

    this.setState({ errors })
    return Object.keys(errors).length === 0
  }

  // ==================== 表单处理（统一处理所有输入）====================
  
  handleInputChange = (event) => {
    const { name, value, type, checked } = event.target
    
    this.setState({
      [name]: type === 'checkbox' ? checked : value,
      errors: { ...this.state.errors, [name]: '' } // 清除该字段的错误
    })
  }

  // ==================== 计算派生数据 ====================
  
  calculatePositionSize = () => {
    const { collateral, leverage } = this.state
    if (!collateral) return 0
    return parseFloat(collateral) * leverage
  }

  calculateLiquidationPrice = () => {
    const { direction, leverage } = this.state
    const currentPrice = 2000 // 假设当前 ETH 价格
    
    if (direction === 'long') {
      return currentPrice * (1 - 1 / leverage)
    } else {
      return currentPrice * (1 + 1 / leverage)
    }
  }

  // ==================== 提交表单 ====================
  
  handleSubmit = async (event) => {
    event.preventDefault()
    
    if (!this.validateCurrentStep()) {
      return
    }

    this.setState({ isSubmitting: true })

    // 模拟 API 调用
    try {
      const orderData = {
        tradingPair: this.state.tradingPair,
        direction: this.state.direction,
        leverage: this.state.leverage,
        collateral: this.state.collateral,
        positionSize: this.calculatePositionSize(),
        takeProfitPrice: this.state.takeProfitPrice,
        stopLossPrice: this.state.stopLossPrice,
      }

      console.log('提交订单:', orderData)
      
      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('开仓成功！')
      
      // 重置表单
      this.resetForm()
      
    } catch (error) {
      console.error('开仓失败:', error)
      alert('开仓失败，请重试')
    } finally {
      this.setState({ isSubmitting: false })
    }
  }

  resetForm = () => {
    this.setState({
      currentStep: 1,
      tradingPair: 'ETH/USDT',
      direction: 'long',
      leverage: 10,
      collateral: '',
      takeProfitPrice: '',
      stopLossPrice: '',
      agreedToTerms: false,
      errors: {},
    })
  }

  // ==================== 渲染步骤指示器 ====================
  
  renderStepIndicator = () => {
    const { currentStep } = this.state
    const steps = [
      { number: 1, title: '选择交易对' },
      { number: 2, title: '设置杠杆' },
      { number: 3, title: '止盈止损' },
      { number: 4, title: '确认开仓' },
    ]

    return (
      <div className="step-indicator">
        {steps.map((step) => (
          <div 
            key={step.number}
            className={`step ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
            onClick={() => currentStep > step.number && this.goToStep(step.number)}
          >
            <div className="step-number">{step.number}</div>
            <div className="step-title">{step.title}</div>
          </div>
        ))}
      </div>
    )
  }

  // ==================== 渲染各个步骤 ====================
  
  renderStep1 = () => {
    const { tradingPair, direction, errors } = this.state

    return (
      <div className="step-content">
        <h2>步骤 1: 选择交易对和方向</h2>
        
        <div className="form-group">
          <label>交易对:</label>
          <select 
            name="tradingPair" 
            value={tradingPair} 
            onChange={this.handleInputChange}
          >
            <option value="ETH/USDT">ETH/USDT</option>
            <option value="BTC/USDT">BTC/USDT</option>
            <option value="BNB/USDT">BNB/USDT</option>
          </select>
          {errors.tradingPair && <span className="error">{errors.tradingPair}</span>}
        </div>

        <div className="form-group">
          <label>交易方向:</label>
          <div className="radio-group">
            <label className={`radio-card ${direction === 'long' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="direction"
                value="long"
                checked={direction === 'long'}
                onChange={this.handleInputChange}
              />
              <span className="radio-label">
                <span className="direction-icon long">📈</span>
                做多 (Long)
              </span>
            </label>
            
            <label className={`radio-card ${direction === 'short' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="direction"
                value="short"
                checked={direction === 'short'}
                onChange={this.handleInputChange}
              />
              <span className="radio-label">
                <span className="direction-icon short">📉</span>
                做空 (Short)
              </span>
            </label>
          </div>
          {errors.direction && <span className="error">{errors.direction}</span>}
        </div>
      </div>
    )
  }

  renderStep2 = () => {
    const { leverage, collateral, errors } = this.state
    const positionSize = this.calculatePositionSize()

    return (
      <div className="step-content">
        <h2>步骤 2: 设置杠杆和保证金</h2>
        
        <div className="form-group">
          <label>杠杆倍数: {leverage}x</label>
          <input
            type="range"
            name="leverage"
            min="1"
            max="100"
            value={leverage}
            onChange={this.handleInputChange}
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
            value={collateral}
            onChange={this.handleInputChange}
            placeholder="输入保证金金额"
            step="0.01"
          />
          {errors.collateral && <span className="error">{errors.collateral}</span>}
        </div>

        {collateral && (
          <div className="info-box">
            <h3>仓位信息</h3>
            <div className="info-row">
              <span>仓位大小:</span>
              <strong>{positionSize.toFixed(2)} USDT</strong>
            </div>
            <div className="info-row">
              <span>预计强平价:</span>
              <strong>${this.calculateLiquidationPrice().toFixed(2)}</strong>
            </div>
          </div>
        )}
      </div>
    )
  }

  renderStep3 = () => {
    const { takeProfitPrice, stopLossPrice, errors } = this.state

    return (
      <div className="step-content">
        <h2>步骤 3: 设置止盈止损（可选）</h2>
        
        <div className="form-group">
          <label>止盈价格 (USDT):</label>
          <input
            type="number"
            name="takeProfitPrice"
            value={takeProfitPrice}
            onChange={this.handleInputChange}
            placeholder="达到此价格自动平仓获利"
            step="0.01"
          />
          {errors.takeProfitPrice && <span className="error">{errors.takeProfitPrice}</span>}
        </div>

        <div className="form-group">
          <label>止损价格 (USDT):</label>
          <input
            type="number"
            name="stopLossPrice"
            value={stopLossPrice}
            onChange={this.handleInputChange}
            placeholder="达到此价格自动平仓止损"
            step="0.01"
          />
          {errors.stopLossPrice && <span className="error">{errors.stopLossPrice}</span>}
        </div>

        <div className="info-box warning">
          <p>💡 提示：止盈止损可以帮助您自动管理风险，建议设置</p>
        </div>
      </div>
    )
  }

  renderStep4 = () => {
    const { 
      tradingPair, 
      direction, 
      leverage, 
      collateral, 
      takeProfitPrice, 
      stopLossPrice,
      agreedToTerms,
      errors 
    } = this.state

    return (
      <div className="step-content">
        <h2>步骤 4: 确认订单信息</h2>
        
        <div className="order-summary">
          <h3>订单摘要</h3>
          
          <div className="summary-row">
            <span>交易对:</span>
            <strong>{tradingPair}</strong>
          </div>
          
          <div className="summary-row">
            <span>方向:</span>
            <strong className={direction === 'long' ? 'long' : 'short'}>
              {direction === 'long' ? '做多 📈' : '做空 📉'}
            </strong>
          </div>
          
          <div className="summary-row">
            <span>杠杆:</span>
            <strong>{leverage}x</strong>
          </div>
          
          <div className="summary-row">
            <span>保证金:</span>
            <strong>{collateral} USDT</strong>
          </div>
          
          <div className="summary-row">
            <span>仓位大小:</span>
            <strong>{this.calculatePositionSize().toFixed(2)} USDT</strong>
          </div>
          
          <div className="summary-row">
            <span>预计强平价:</span>
            <strong className="warning">${this.calculateLiquidationPrice().toFixed(2)}</strong>
          </div>
          
          {takeProfitPrice && (
            <div className="summary-row">
              <span>止盈价格:</span>
              <strong className="success">${takeProfitPrice}</strong>
            </div>
          )}
          
          {stopLossPrice && (
            <div className="summary-row">
              <span>止损价格:</span>
              <strong className="danger">${stopLossPrice}</strong>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="agreedToTerms"
              checked={agreedToTerms}
              onChange={this.handleInputChange}
            />
            <span>我已阅读并同意 <a href="#terms">交易条款</a> 和 <a href="#risks">风险提示</a></span>
          </label>
          {errors.agreedToTerms && <span className="error">{errors.agreedToTerms}</span>}
        </div>
      </div>
    )
  }

  // ==================== 主渲染 ====================
  
  render() {
    const { currentStep, isSubmitting } = this.state

    return (
      <div className="leverage-trade-form">
        <h1>杠杆交易开仓</h1>
        
        {this.renderStepIndicator()}
        
        <form onSubmit={this.handleSubmit}>
          {/* 根据当前步骤渲染对应内容 */}
          {currentStep === 1 && this.renderStep1()}
          {currentStep === 2 && this.renderStep2()}
          {currentStep === 3 && this.renderStep3()}
          {currentStep === 4 && this.renderStep4()}
          
          {/* 导航按钮 */}
          <div className="form-actions">
            {currentStep > 1 && (
              <button 
                type="button" 
                onClick={this.prevStep}
                className="btn btn-secondary"
              >
                上一步
              </button>
            )}
            
            {currentStep < 4 ? (
              <button 
                type="button" 
                onClick={this.nextStep}
                className="btn btn-primary"
              >
                下一步
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn btn-success"
                disabled={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '确认开仓'}
              </button>
            )}
          </div>
        </form>
      </div>
    )
  }
}

export default LeverageTradeForm

/**
 * 关键知识点总结：
 * 
 * 1. 受控组件（CoderWhy 课程核心）
 *    - 所有表单输入都通过 state 管理
 *    - 使用 value + onChange 实现双向绑定
 *    - 统一的 handleInputChange 处理所有输入
 * 
 * 2. 多步骤表单管理
 *    - 使用 currentStep 状态控制步骤
 *    - 每步独立验证
 *    - 可以前进、后退、跳转
 * 
 * 3. 表单验证
 *    - validateCurrentStep 方法验证当前步骤
 *    - errors 对象存储所有错误信息
 *    - 实时清除错误提示
 * 
 * 4. 计算属性
 *    - calculatePositionSize 计算仓位大小
 *    - calculateLiquidationPrice 计算强平价
 *    - 类似 Vue 的 computed
 * 
 * 5. 统一表单处理
 *    - 使用 name 属性标识字段
 *    - 使用 [name]: value 动态更新 state
 *    - 支持 text、number、checkbox、radio、select
 * 
 * 6. 类似电商结算流程
 *    - 选择商品 → 填写地址 → 选择支付 → 确认订单
 *    - 选择交易对 → 设置杠杆 → 止盈止损 → 确认开仓
 */
