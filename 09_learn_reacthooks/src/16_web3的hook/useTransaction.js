import { useReducer, useCallback, useRef } from 'react';

/**
 * useTransaction - 交易管理 Hook
 * 
 * 功能：
 * 1. 发送交易
 * 2. 跟踪交易状态
 * 3. 等待交易确认
 * 4. Gas 费估算
 * 
 * 面试要点：
 * - useReducer 管理复杂状态
 * - useCallback 封装交易逻辑
 * - useRef 保存可变值
 * - Promise 处理异步流程
 */

// 交易状态
const TRANSACTION_STATUS = {
  IDLE: 'idle',
  ESTIMATING: 'estimating',
  PENDING: 'pending',
  CONFIRMING: 'confirming',
  SUCCESS: 'success',
  FAILED: 'failed'
};

// Reducer 初始状态
const initialState = {
  status: TRANSACTION_STATUS.IDLE,
  txHash: null,
  receipt: null,
  error: null,
  gasEstimate: null
};

// Reducer 函数
const transactionReducer = (state, action) => {
  switch (action.type) {
    case 'ESTIMATING':
      return {
        ...state,
        status: TRANSACTION_STATUS.ESTIMATING,
        error: null
      };
    
    case 'ESTIMATE_SUCCESS':
      return {
        ...state,
        gasEstimate: action.payload
      };
    
    case 'PENDING':
      return {
        ...state,
        status: TRANSACTION_STATUS.PENDING,
        txHash: null,
        error: null
      };
    
    case 'CONFIRMING':
      return {
        ...state,
        status: TRANSACTION_STATUS.CONFIRMING,
        txHash: action.payload
      };
    
    case 'SUCCESS':
      return {
        ...state,
        status: TRANSACTION_STATUS.SUCCESS,
        receipt: action.payload,
        error: null
      };
    
    case 'FAILED':
      return {
        ...state,
        status: TRANSACTION_STATUS.FAILED,
        error: action.payload
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
};

const useTransaction = () => {
  // 使用 useReducer 管理复杂的交易状态
  const [state, dispatch] = useReducer(transactionReducer, initialState);
  
  // 使用 useRef 保存取消标志（不触发重渲染）
  const isCancelledRef = useRef(false);

  // Gas 费估算
  const estimateGas = useCallback(async (txParams) => {
    dispatch({ type: 'ESTIMATING' });

    try {
      const gasEstimate = await window.ethereum.request({
        method: 'eth_estimateGas',
        params: [txParams]
      });

      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice'
      });

      const estimate = {
        gasLimit: parseInt(gasEstimate, 16),
        gasPrice: parseInt(gasPrice, 16),
        totalCost: (parseInt(gasEstimate, 16) * parseInt(gasPrice, 16)) / Math.pow(10, 18)
      };

      dispatch({ type: 'ESTIMATE_SUCCESS', payload: estimate });
      return estimate;
    } catch (err) {
      console.error('Gas 估算失败:', err);
      throw err;
    }
  }, []);

  // 发送交易
  const sendTransaction = useCallback(async (txParams) => {
    if (!window.ethereum) {
      throw new Error('未检测到钱包');
    }

    // 重置取消标志
    isCancelledRef.current = false;

    try {
      // 1. 估算 Gas
      dispatch({ type: 'ESTIMATING' });
      const gasEstimate = await estimateGas(txParams);
      
      if (isCancelledRef.current) return;

      // 2. 发送交易
      dispatch({ type: 'PENDING' });
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          ...txParams,
          gas: `0x${gasEstimate.gasLimit.toString(16)}`
        }]
      });

      console.log('交易已发送:', txHash);
      
      if (isCancelledRef.current) return;

      // 3. 等待交易确认
      dispatch({ type: 'CONFIRMING', payload: txHash });
      
      const receipt = await waitForTransaction(txHash);
      
      if (isCancelledRef.current) return;

      // 4. 检查交易状态
      if (receipt.status === '0x1') {
        dispatch({ type: 'SUCCESS', payload: receipt });
        return { txHash, receipt };
      } else {
        throw new Error('交易执行失败');
      }
    } catch (err) {
      console.error('交易失败:', err);
      dispatch({ type: 'FAILED', payload: err.message });
      throw err;
    }
  }, [estimateGas]);

  // 等待交易确认
  const waitForTransaction = async (txHash, confirmations = 1) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 60; // 最多等待 60 次（约 5 分钟）

      const checkReceipt = async () => {
        if (isCancelledRef.current) {
          reject(new Error('交易已取消'));
          return;
        }

        try {
          const receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash]
          });

          if (receipt) {
            // 检查确认数
            const currentBlock = await window.ethereum.request({
              method: 'eth_blockNumber'
            });
            
            const confirmationCount = parseInt(currentBlock, 16) - parseInt(receipt.blockNumber, 16);
            
            if (confirmationCount >= confirmations) {
              resolve(receipt);
            } else {
              setTimeout(checkReceipt, 5000);
            }
          } else {
            attempts++;
            if (attempts >= maxAttempts) {
              reject(new Error('交易确认超时'));
            } else {
              setTimeout(checkReceipt, 5000);
            }
          }
        } catch (err) {
          reject(err);
        }
      };

      checkReceipt();
    });
  };

  // 取消交易（实际上是停止等待）
  const cancel = useCallback(() => {
    isCancelledRef.current = true;
    dispatch({ type: 'RESET' });
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    // 状态
    status: state.status,
    txHash: state.txHash,
    receipt: state.receipt,
    error: state.error,
    gasEstimate: state.gasEstimate,
    
    // 派生状态
    isIdle: state.status === TRANSACTION_STATUS.IDLE,
    isEstimating: state.status === TRANSACTION_STATUS.ESTIMATING,
    isPending: state.status === TRANSACTION_STATUS.PENDING,
    isConfirming: state.status === TRANSACTION_STATUS.CONFIRMING,
    isSuccess: state.status === TRANSACTION_STATUS.SUCCESS,
    isFailed: state.status === TRANSACTION_STATUS.FAILED,
    isLoading: [
      TRANSACTION_STATUS.ESTIMATING,
      TRANSACTION_STATUS.PENDING,
      TRANSACTION_STATUS.CONFIRMING
    ].includes(state.status),
    
    // 方法
    sendTransaction,
    estimateGas,
    cancel,
    reset
  };
};

export default useTransaction;

/**
 * 使用示例：
 * 
 * const { 
 *   sendTransaction, 
 *   status, 
 *   txHash, 
 *   receipt,
 *   isLoading 
 * } = useTransaction();
 * 
 * const handleSend = async () => {
 *   try {
 *     const result = await sendTransaction({
 *       from: account,
 *       to: recipientAddress,
 *       value: '0x' + (amount * Math.pow(10, 18)).toString(16)
 *     });
 *     console.log('交易成功:', result);
 *   } catch (err) {
 *     console.error('交易失败:', err);
 *   }
 * };
 */

/**
 * 面试要点总结：
 * 
 * 1. useReducer vs useState：
 *    - 状态逻辑复杂时使用 useReducer
 *    - 多个相关状态统一管理
 *    - 状态转换更清晰可预测
 * 
 * 2. useRef 的使用：
 *    - 保存可变值，不触发重渲染
 *    - 用于取消标志、定时器引用等
 *    - 在整个组件生命周期保持不变
 * 
 * 3. useCallback 优化：
 *    - 缓存函数引用
 *    - 避免子组件不必要的重渲染
 *    - 依赖数组控制函数更新
 * 
 * 4. 异步流程处理：
 *    - Promise 链式调用
 *    - async/await 语法
 *    - 错误边界处理
 * 
 * 5. 状态机模式：
 *    - 定义明确的状态枚举
 *    - 状态转换通过 action 触发
 *    - 易于测试和维护
 * 
 * 6. 取消机制：
 *    - 使用 useRef 保存取消标志
 *    - 在异步操作中检查标志
 *    - 防止组件卸载后更新状态
 */
