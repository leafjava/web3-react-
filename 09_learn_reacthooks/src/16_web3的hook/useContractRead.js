import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * useContractRead - 智能合约读取 Hook
 * 
 * 功能：
 * 1. 读取智能合约数据
 * 2. 自动轮询刷新
 * 3. 缓存管理
 * 4. 错误重试
 * 
 * 面试要点：
 * - useMemo 缓存合约实例
 * - useEffect 处理数据获取
 * - 依赖数组控制重新请求
 * - 清理定时器防止内存泄漏
 */

const useContractRead = ({
  contractAddress,
  abi,
  functionName,
  args = [],
  enabled = true,
  pollingInterval = 0, // 0 表示不轮询
  cacheTime = 5000 // 缓存时间（毫秒）
}) => {
  // 状态管理
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // 使用 useMemo 缓存合约实例（避免每次渲染都创建新实例）
  const contract = useMemo(() => {
    if (!contractAddress || !abi || !window.ethereum) return null;

    try {
      // 模拟创建合约实例（实际项目中使用 ethers.js 或 web3.js）
      return {
        address: contractAddress,
        abi,
        call: async (method, params) => {
          // 模拟合约调用
          const response = await window.ethereum.request({
            method: 'eth_call',
            params: [{
              to: contractAddress,
              data: encodeFunction(method, params)
            }, 'latest']
          });
          return response;
        }
      };
    } catch (err) {
      console.error('创建合约实例失败:', err);
      return null;
    }
  }, [contractAddress, abi]); // 只在 contractAddress 或 abi 变化时重新创建

  // 编码函数调用（简化版，实际使用 ethers.js）
  const encodeFunction = (functionName, args) => {
    // 实际项目中使用 ethers.utils.Interface
    return `0x${functionName}${args.join('')}`;
  };

  // 读取合约数据
  const fetchData = useCallback(async () => {
    // 检查缓存是否有效
    const now = Date.now();
    if (data && now - lastFetchTime < cacheTime) {
      console.log('使用缓存数据');
      return;
    }

    if (!contract || !enabled) return;

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      console.log(`调用合约方法: ${functionName}`, args);
      
      // 模拟合约调用
      const result = await contract.call(functionName, args);
      
      // 模拟数据解析
      const parsedData = parseContractResult(result);
      
      setData(parsedData);
      setLastFetchTime(Date.now());
    } catch (err) {
      console.error('读取合约数据失败:', err);
      setIsError(true);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [contract, functionName, args, enabled, data, lastFetchTime, cacheTime]);
  // 依赖项：contract, functionName, args 变化时重新获取数据

  // 解析合约返回结果（简化版）
  const parseContractResult = (result) => {
    // 实际项目中使用 ethers.js 解析
    if (functionName === 'balanceOf') {
      return {
        balance: parseInt(result, 16).toString(),
        formatted: (parseInt(result, 16) / Math.pow(10, 18)).toFixed(4)
      };
    }
    if (functionName === 'totalSupply') {
      return {
        totalSupply: parseInt(result, 16).toString(),
        formatted: (parseInt(result, 16) / Math.pow(10, 18)).toFixed(0)
      };
    }
    return result;
  };

  // 初始数据获取
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]); // enabled 或 fetchData 变化时执行

  // 轮询刷新
  useEffect(() => {
    if (!enabled || pollingInterval <= 0) return;

    console.log(`开启轮询，间隔: ${pollingInterval}ms`);
    
    const timer = setInterval(() => {
      fetchData();
    }, pollingInterval);

    // 清理函数：组件卸载或依赖变化时清除定时器
    return () => {
      console.log('清除轮询定时器');
      clearInterval(timer);
    };
  }, [enabled, pollingInterval, fetchData]); // 依赖项变化时重新设置定时器

  // 手动刷新
  const refetch = useCallback(() => {
    // 清除缓存，强制重新获取
    setLastFetchTime(0);
    return fetchData();
  }, [fetchData]);

  return {
    // 数据
    data,
    
    // 状态
    isLoading,
    isError,
    error,
    isSuccess: !isLoading && !isError && data !== null,
    
    // 方法
    refetch
  };
};

export default useContractRead;

/**
 * 使用示例：
 * 
 * const { data, isLoading, error, refetch } = useContractRead({
 *   contractAddress: '0x...',
 *   abi: [...],
 *   functionName: 'balanceOf',
 *   args: [userAddress],
 *   enabled: !!userAddress,
 *   pollingInterval: 10000, // 每 10 秒刷新一次
 *   cacheTime: 5000 // 缓存 5 秒
 * });
 */

/**
 * 面试要点总结：
 * 
 * 1. useMemo 的使用：
 *    - 缓存合约实例，避免重复创建
 *    - 依赖数组控制何时重新创建
 *    - 适用于计算开销大的对象
 * 
 * 2. useEffect 依赖数组：
 *    - 初始数据获取：依赖 enabled 和 fetchData
 *    - 轮询刷新：依赖 enabled、pollingInterval 和 fetchData
 *    - 依赖项变化时重新执行副作用
 * 
 * 3. useCallback 优化：
 *    - fetchData 使用 useCallback 缓存
 *    - 避免 useEffect 无限循环
 *    - refetch 方法也使用 useCallback
 * 
 * 4. 缓存策略：
 *    - 使用 lastFetchTime 记录获取时间
 *    - cacheTime 内使用缓存数据
 *    - 减少不必要的网络请求
 * 
 * 5. 清理函数：
 *    - 清除定时器防止内存泄漏
 *    - 组件卸载时自动清理
 *    - 依赖项变化时也会清理
 * 
 * 6. 错误处理：
 *    - try-catch 捕获异步错误
 *    - 使用 isError 和 error 状态
 *    - 提供友好的错误信息
 * 
 * 7. 性能优化：
 *    - 轮询间隔可配置
 *    - 缓存机制减少请求
 *    - enabled 参数控制是否执行
 */
