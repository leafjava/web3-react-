import React, { useState } from 'react';
import useWallet from './useWallet';
import useContractRead from './useContractRead';
import useTransaction from './useTransaction';
import './App.css';

/**
 * 自定义 Hook 使用示例
 * 
 * 展示如何在实际组件中使用：
 * - useWallet
 * - useContractRead
 * - useTransaction
 */

// 模拟的 ERC20 合约 ABI（简化版）
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }]
  },
  {
    name: 'totalSupply',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'supply', type: 'uint256' }]
  }
];

const CONTRACT_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // DAI 合约地址

function App() {
  // 1. 使用 useWallet Hook
  const {
    account,
    balance,
    chainId,
    isConnecting,
    isConnected,
    error: walletError,
    connect,
    disconnect,
    refreshBalance
  } = useWallet();

  // 2. 使用 useContractRead Hook - 读取代币余额
  const {
    data: tokenBalance,
    isLoading: isLoadingBalance,
    error: balanceError,
    refetch: refetchBalance
  } = useContractRead({
    contractAddress: CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account],
    enabled: !!account, // 只在连接钱包后启用
    pollingInterval: 10000, // 每 10 秒刷新一次
    cacheTime: 5000
  });

  // 3. 使用 useContractRead Hook - 读取总供应量
  const {
    data: totalSupply,
    isLoading: isLoadingSupply
  } = useContractRead({
    contractAddress: CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
    args: [],
    enabled: !!account,
    pollingInterval: 30000 // 每 30 秒刷新一次
  });

  // 4. 使用 useTransaction Hook
  const {
    sendTransaction,
    status: txStatus,
    txHash,
    receipt,
    isLoading: isSending,
    isSuccess: txSuccess,
    error: txError,
    reset: resetTx
  } = useTransaction();

  // 发送交易的表单状态
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  // 处理发送交易
  const handleSendTransaction = async (e) => {
    e.preventDefault();
    
    if (!recipient || !amount) {
      alert('请填写收款地址和金额');
      return;
    }

    try {
      const result = await sendTransaction({
        from: account,
        to: recipient,
        value: '0x' + (parseFloat(amount) * Math.pow(10, 18)).toString(16)
      });
      
      console.log('交易成功:', result);
      alert(`交易成功！\n交易哈希: ${result.txHash}`);
      
      // 刷新余额
      refreshBalance();
      refetchBalance();
    } catch (err) {
      console.error('交易失败:', err);
    }
  };

  // 获取网络名称
  const getNetworkName = (chainId) => {
    const networks = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Mumbai Testnet'
    };
    return networks[chainId] || `Unknown (${chainId})`;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔗 自定义 Hook 示例</h1>
        <p>useWallet + useContractRead + useTransaction</p>
      </header>

      <main className="app-main">
        {/* 钱包连接部分 */}
        <section className="wallet-section">
          <h2>1. useWallet - 钱包管理</h2>
          
          {!isConnected ? (
            <div className="connect-container">
              <button 
                onClick={connect} 
                disabled={isConnecting}
                className="btn btn-primary"
              >
                {isConnecting ? '连接中...' : '连接钱包'}
              </button>
              {walletError && <p className="error">{walletError}</p>}
            </div>
          ) : (
            <div className="wallet-info">
              <div className="info-item">
                <span className="label">账户地址:</span>
                <span className="value">{account?.slice(0, 6)}...{account?.slice(-4)}</span>
              </div>
              <div className="info-item">
                <span className="label">ETH 余额:</span>
                <span className="value">{balance} ETH</span>
              </div>
              <div className="info-item">
                <span className="label">网络:</span>
                <span className="value">{getNetworkName(chainId)}</span>
              </div>
              <div className="button-group">
                <button onClick={refreshBalance} className="btn btn-secondary">
                  刷新余额
                </button>
                <button onClick={disconnect} className="btn btn-danger">
                  断开连接
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 合约读取部分 */}
        {isConnected && (
          <section className="contract-section">
            <h2>2. useContractRead - 合约数据读取</h2>
            
            <div className="contract-info">
              <div className="info-card">
                <h3>代币余额</h3>
                {isLoadingBalance ? (
                  <p className="loading">加载中...</p>
                ) : balanceError ? (
                  <p className="error">{balanceError}</p>
                ) : (
                  <div>
                    <p className="value-large">{tokenBalance?.formatted || '0'} DAI</p>
                    <button onClick={refetchBalance} className="btn btn-small">
                      刷新
                    </button>
                  </div>
                )}
              </div>

              <div className="info-card">
                <h3>总供应量</h3>
                {isLoadingSupply ? (
                  <p className="loading">加载中...</p>
                ) : (
                  <p className="value-large">{totalSupply?.formatted || '0'} DAI</p>
                )}
              </div>
            </div>

            <div className="feature-note">
              <p>✨ 特性：自动轮询刷新、缓存管理、错误处理</p>
            </div>
          </section>
        )}

        {/* 交易发送部分 */}
        {isConnected && (
          <section className="transaction-section">
            <h2>3. useTransaction - 交易管理</h2>
            
            <form onSubmit={handleSendTransaction} className="tx-form">
              <div className="form-group">
                <label>收款地址:</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  disabled={isSending}
                />
              </div>

              <div className="form-group">
                <label>金额 (ETH):</label>
                <input
                  type="number"
                  step="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.01"
                  disabled={isSending}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSending}
                className="btn btn-primary btn-large"
              >
                {isSending ? `${txStatus}...` : '发送交易'}
              </button>
            </form>

            {/* 交易状态显示 */}
            {txStatus !== 'idle' && (
              <div className="tx-status">
                <h3>交易状态</h3>
                <div className={`status-badge status-${txStatus}`}>
                  {txStatus.toUpperCase()}
                </div>
                
                {txHash && (
                  <div className="info-item">
                    <span className="label">交易哈希:</span>
                    <span className="value">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                  </div>
                )}

                {txSuccess && receipt && (
                  <div className="success-message">
                    <p>✅ 交易成功！</p>
                    <p>区块号: {parseInt(receipt.blockNumber, 16)}</p>
                  </div>
                )}

                {txError && (
                  <div className="error-message">
                    <p>❌ 交易失败</p>
                    <p>{txError}</p>
                  </div>
                )}

                {(txSuccess || txError) && (
                  <button onClick={resetTx} className="btn btn-secondary">
                    重置
                  </button>
                )}
              </div>
            )}

            <div className="feature-note">
              <p>✨ 特性：Gas 估算、状态跟踪、交易确认、错误处理</p>
            </div>
          </section>
        )}
      </main>

      {/* 说明文档 */}
      <footer className="app-footer">
        <h3>📚 自定义 Hook 说明</h3>
        <div className="docs">
          <div className="doc-item">
            <h4>useWallet</h4>
            <ul>
              <li>管理钱包连接状态</li>
              <li>监听账户和网络切换</li>
              <li>查询账户余额</li>
            </ul>
          </div>
          <div className="doc-item">
            <h4>useContractRead</h4>
            <ul>
              <li>读取智能合约数据</li>
              <li>自动轮询刷新</li>
              <li>缓存和错误处理</li>
            </ul>
          </div>
          <div className="doc-item">
            <h4>useTransaction</h4>
            <ul>
              <li>发送区块链交易</li>
              <li>跟踪交易状态</li>
              <li>Gas 费估算</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
