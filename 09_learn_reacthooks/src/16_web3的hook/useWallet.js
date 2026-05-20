import { useState, useEffect, useCallback } from 'react';

/**
 * useWallet - 钱包连接管理 Hook
 * 
 * 功能：
 * 1. 连接/断开钱包
 * 2. 监听账户切换
 * 3. 监听网络切换
 * 4. 查询账户余额
 * 5. 错误处理
 * 
 * 面试要点：
 * - useState 管理多个状态
 * - useEffect 处理副作用和清理
 * - useCallback 优化回调函数
 * - 依赖数组的正确使用
 */

const useWallet = () => {
  // 状态管理
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // 检查是否安装 MetaMask
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // 获取账户余额
  const fetchBalance = useCallback(async (address) => {
    try {
      if (!window.ethereum) return;
      
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      // 将 Wei 转换为 ETH
      const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
      setBalance(ethBalance.toFixed(4));
    } catch (err) {
      console.error('获取余额失败:', err);
      setError(err.message);
    }
  }, []); // 空依赖数组，函数只创建一次

  // 连接钱包
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('请安装 MetaMask 钱包');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // 请求账户授权
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // 获取链 ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      setAccount(accounts[0]);
      setChainId(chainId);
      
      // 获取余额
      await fetchBalance(accounts[0]);
    } catch (err) {
      console.error('连接钱包失败:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalance]); // fetchBalance 作为依赖

  // 断开连接
  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance('0');
    setChainId(null);
    setError(null);
  }, []); // 无外部依赖

  // 监听账户切换
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      console.log('账户切换:', accounts);
      
      if (accounts.length === 0) {
        // 用户断开了所有账户
        disconnect();
      } else if (accounts[0] !== account) {
        // 切换到新账户
        setAccount(accounts[0]);
        fetchBalance(accounts[0]);
      }
    };

    // 监听账户变化事件
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    // 清理函数：组件卸载时移除监听器
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [account, disconnect, fetchBalance]); // 依赖项：account, disconnect, fetchBalance

  // 监听网络切换
  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (newChainId) => {
      console.log('网络切换:', newChainId);
      setChainId(newChainId);
      
      // 网络切换后重新获取余额
      if (account) {
        fetchBalance(account);
      }
    };

    // 监听网络变化事件
    window.ethereum.on('chainChanged', handleChainChanged);

    // 清理函数
    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [account, fetchBalance]); // 依赖项：account, fetchBalance

  // 初始化：检查是否已连接
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        // 获取已授权的账户（不会弹出授权窗口）
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });

        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({
            method: 'eth_chainId'
          });

          setAccount(accounts[0]);
          setChainId(chainId);
          await fetchBalance(accounts[0]);
        }
      } catch (err) {
        console.error('检查连接状态失败:', err);
      }
    };

    checkConnection();
  }, [fetchBalance]); // 只在组件挂载时执行一次（fetchBalance 是稳定的）

  // 返回状态和方法
  return {
    // 状态
    account,
    balance,
    chainId,
    isConnecting,
    error,
    isConnected: !!account,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    
    // 方法
    connect,
    disconnect,
    refreshBalance: () => account && fetchBalance(account)
  };
};

export default useWallet;

/**
 * 面试要点总结：
 * 
 * 1. useEffect 依赖数组原理：
 *    - 使用 Object.is() 进行浅比较
 *    - 依赖项变化时才执行副作用
 *    - 清理函数在组件卸载或下次 effect 执行前调用
 * 
 * 2. useCallback 的使用：
 *    - 缓存函数引用，避免子组件不必要的重渲染
 *    - 依赖数组控制函数何时重新创建
 * 
 * 3. 多个 useEffect 的组织：
 *    - 按功能分离不同的副作用
 *    - 每个 effect 有独立的依赖数组
 *    - 清理函数确保没有内存泄漏
 * 
 * 4. 错误处理：
 *    - try-catch 捕获异步错误
 *    - 使用 error 状态向用户反馈
 * 
 * 5. 自定义 Hook 设计原则：
 *    - 单一职责：只负责钱包相关逻辑
 *    - 返回值清晰：状态和方法分组
 *    - 可复用：可在多个组件中使用
 */
