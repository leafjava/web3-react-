/**
 * RTK Query 完整示例应用
 * 
 * 这个文件展示如何在实际应用中组合使用所有 RTK Query 功能
 */

import React, { useState } from 'react'
import { Provider } from 'react-redux'
import store from './store'

// 导入组件
import WalletBalance from './components/WalletBalance'
import SendTransaction from './components/SendTransaction'
import TokenList from './components/TokenList'

// 导入自定义 Hook
import { useWalletWithRTK, useMultiChainBalance } from './hooks/useWalletWithRTK'

// ==================== 主应用 ====================

function App() {
  return (
    <Provider store={store}>
      <div className="app">
        <header>
          <h1>RTK Query Web3 示例应用</h1>
        </header>
        
        <main>
          <Dashboard />
        </main>
      </div>
    </Provider>
  )
}

// ==================== 仪表板 ====================

function Dashboard() {
  const [activeTab, setActiveTab] = useState('wallet')
  
  return (
    <div className="dashboard">
      {/* 标签页导航 */}
      <nav className="tabs">
        <button
          className={activeTab === 'wallet' ? 'active' : ''}
          onClick={() => setActiveTab('wallet')}
        >
          钱包
        </button>
        <button
          className={activeTab === 'tokens' ? 'active' : ''}
          onClick={() => setActiveTab('tokens')}
        >
          代币价格
        </button>
        <button
          className={activeTab === 'multichain' ? 'active' : ''}
          onClick={() => setActiveTab('multichain')}
        >
          多链余额
        </button>
      </nav>
      
      {/* 标签页内容 */}
      <div className="tab-content">
        {activeTab === 'wallet' && <WalletTab />}
        {activeTab === 'tokens' && <TokensTab />}
        {activeTab === 'multichain' && <MultiChainTab />}
      </div>
    </div>
  )
}

// ==================== 钱包标签页 ====================

function WalletTab() {
  // 模拟钱包地址和链 ID
  const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
  const chainId = 1
  
  return (
    <div className="wallet-tab">
      <section>
        <h2>钱包余额</h2>
        <WalletBalance address={address} chainId={chainId} />
      </section>
      
      <section>
        <h2>发送交易</h2>
        <SendTransaction fromAddress={address} chainId={chainId} />
      </section>
      
      <section>
        <h2>使用自定义 Hook</h2>
        <WalletWithHook />
      </section>
    </div>
  )
}

// 使用自定义 Hook 的组件
function WalletWithHook() {
  const {
    address,
    balance,
    transactions,
    isBalanceLoading,
    refetchAll,
  } = useWalletWithRTK()
  
  if (!address) {
    return <div>请连接钱包</div>
  }
  
  return (
    <div className="wallet-info">
      <div className="info-row">
        <span>地址:</span>
        <code>{address.slice(0, 6)}...{address.slice(-4)}</code>
      </div>
      
      <div className="info-row">
        <span>余额:</span>
        {isBalanceLoading ? (
          <span>加载中...</span>
        ) : (
          <strong>{balance} ETH</strong>
        )}
      </div>
      
      <div className="info-row">
        <span>交易数:</span>
        <span>{transactions.length}</span>
      </div>
      
      <button onClick={refetchAll}>刷新所有数据</button>
    </div>
  )
}

// ==================== 代币价格标签页 ====================

function TokensTab() {
  return (
    <div className="tokens-tab">
      <h2>实时代币价格</h2>
      <p>价格每 60 秒自动更新</p>
      <TokenList />
    </div>
  )
}

// ==================== 多链余额标签页 ====================

function MultiChainTab() {
  const chains = [
    { id: 1, name: 'Ethereum' },
    { id: 56, name: 'BSC' },
    { id: 137, name: 'Polygon' },
  ]
  
  const { balances, totalBalance, isLoading } = useMultiChainBalance(
    chains.map(c => c.id)
  )
  
  return (
    <div className="multichain-tab">
      <h2>多链余额总览</h2>
      
      {isLoading ? (
        <div>加载中...</div>
      ) : (
        <>
          <div className="total-balance">
            <h3>总余额</h3>
            <p className="amount">{totalBalance.toFixed(4)} ETH</p>
          </div>
          
          <div className="chain-balances">
            {balances.map(({ chainId, balance }, index) => (
              <div key={chainId} className="chain-card">
                <h4>{chains[index].name}</h4>
                <p>{balance.toFixed(4)} ETH</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ==================== 样式（可选） ====================

const styles = `
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

header {
  text-align: center;
  margin-bottom: 40px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.tabs button {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tabs button.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.tab-content {
  padding: 20px 0;
}

section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.wallet-info {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.total-balance {
  text-align: center;
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 20px;
}

.total-balance .amount {
  font-size: 36px;
  font-weight: bold;
  margin: 10px 0;
}

.chain-balances {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.chain-card {
  padding: 20px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
}

button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #0056b3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
`

// 注入样式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
}

export default App

/**
 * 使用说明：
 * 
 * 1. 安装依赖：
 *    npm install @reduxjs/toolkit react-redux
 * 
 * 2. 在 index.js 中导入：
 *    import App from './src2/App'
 *    ReactDOM.render(<App />, document.getElementById('root'))
 * 
 * 3. 功能特性：
 *    - 钱包余额查询（自动轮询）
 *    - 发送交易（乐观更新）
 *    - 代币价格实时更新
 *    - 多链余额聚合
 *    - 自定义 Hook 封装
 * 
 * 4. 学习路径：
 *    - 先看 examples/ 文件夹的示例
 *    - 再看 api/ 文件夹的 API 定义
 *    - 最后看 components/ 和 hooks/ 的实际应用
 */
